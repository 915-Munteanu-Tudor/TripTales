const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const schedule = require("node-schedule");
const { kmeans } = require("ml-kmeans");
const nodemailer = require("nodemailer");
const fs = require("fs");
const HttpError = require("../models/http-error");
const { getCoordsForAddress } = require("../util/location");
const Place = require("../models/place");
const User = require("../models/user");
const Post = require("../models/post");
const Cluster = require("../models/cluster");
const PlaceBuilder = require("../builders/place-builder");
const {
  recommendPlaces,
  deleteAllCachedData,
} = require("../recommender/data-train");
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const getPostById = async (req, res, next) => {
  const postId = req.params.pid; // { pid: 'p1' }
  let post;

  try {
    post = await Post.findById(postId).populate("place").exec(); //mongoose allows await, but for real promise, use .exec()
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a post.",
      500
    );
    return next(error);
  }

  if (!post) {
    return next(
      new HttpError("Could not find a post for the provided id.", 404)
    );
  }

  res.json({ post: post.toObject({ getters: true }) }); // { place } => { place: place }; and turn into js object and remove _ to id
};

const getPostsByUserId = async (req, res, next) => {
  const userId = req.params.uid1;
  const viewerUserId = req.params.uid2;
  let userPosts;

  try {
    userPosts = await Post.find({ creator: userId }).populate("place");
  } catch (err) {
    return next(
      new HttpError(
        "Fetching created posts failed, please try again later.",
        500
      )
    );
  }

  if (!userPosts || userPosts.length === 0) {
    if (viewerUserId && viewerUserId !== userId) {
      const sess = await mongoose.startSession();
      sess.startTransaction();
      try {
        await Post.updateMany(
          { creator: userId },
          { $addToSet: { viewedBy: viewerUserId } },
          { session: sess }
        );
        await sess.commitTransaction();
      } catch (err) {
        return next(
          new HttpError(
            "Updating viewedBy for posts failed, please try again later.",
            500
          )
        );
      }
    }
  }

  res.json({
    posts: userPosts.map((p) => p.toObject({ getters: true })),
  });
};

const likePost = async (req, res, next) => {
  const postId = req.params.pid;
  const userId = req.params.uid;

  let postWithLikes;
  try {
    postWithLikes = await Post.findById(postId).populate("likes");
  } catch (err) {
    return next(
      new HttpError(
        "Fetching posts with likes failed, please try again later.",
        500
      )
    );
  }

  if (!postWithLikes) {
    return next(
      new HttpError("Could not find the post for the provided post id.", 404)
    );
  }

  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    return next(
      new HttpError("Fetching user failed, please try again later.", 500)
    );
  }

  if (!user) {
    return next(
      new HttpError("Could not find the user for the provided user id.", 404)
    );
  }

  const userLikedPost = postWithLikes.likes.some(
    (like) => like._id.toString() === user._id.toString()
  );

  if (userLikedPost) {
    try {
      const sess = await mongoose.startSession();
      sess.startTransaction();
      postWithLikes.likes.pull(user);
      await postWithLikes.save({ session: sess });
      await sess.commitTransaction();
      // await deleteAllCachedData();
    } catch (err) {
      const error = new HttpError(
        "Unliking post failed, please try again later.",
        500
      );
      return next(error);
    }
  } else {
    try {
      const sess = await mongoose.startSession();
      sess.startTransaction();
      postWithLikes.likes.push(user);
      await postWithLikes.save({ session: sess });
      await sess.commitTransaction();
      // await deleteAllCachedData();
    } catch (err) {
      console.log(err);
      const error = new HttpError(
        "Liking post failed, please try again later.",
        500
      );
      return next(error);
    }
  }

  res.json({
    likes: postWithLikes.likes.map((p) => p.toObject({ getters: true })),
  });
};

const getSavedPosts = async (req, res, next) => {
  const userId = req.params.uid;
  let userWithSavedPosts;
  try {
    userWithSavedPosts = await User.findById(userId);
    await userWithSavedPosts.populate({
      path: "savedPosts",
      populate: {
        path: "place",
        model: "Place",
      },
    });
  } catch (err) {
    return next(
      new HttpError("Fetching saved posts failed, please try again later.", 500)
    );
  }

  if (
    !userWithSavedPosts.savedPosts ||
    userWithSavedPosts.savedPosts.length === 0
  ) {
    return next(
      new HttpError("Could not find saved posts for this user.", 404)
    );
  }

  res.json({
    posts: userWithSavedPosts.savedPosts.map((p) =>
      p.toObject({ getters: true })
    ),
  });
};

const savePost = async (req, res, next) => {
  const postId = req.params.pid;
  const userId = req.params.uid;

  let post;
  try {
    post = await Post.findById(postId);
  } catch (err) {
    return next(
      new HttpError("Fetching post failed, please try again later.", 500)
    );
  }

  if (!post) {
    return next(
      new HttpError("Could not find the post for the provided post id.", 404)
    );
  }

  let user;
  try {
    user = await User.findById(userId).populate("savedPosts");
  } catch (err) {
    return next(
      new HttpError("Fetching user failed, please try again later.", 500)
    );
  }

  if (!user) {
    return next(
      new HttpError("Could not find the user for the provided user id.", 404)
    );
  }

  if (post.creator._id.equals(user._id)) {
    return next(
      new HttpError("You cannot add your own post to saved posts.", 403)
    );
  }

  if (!user.savedPosts.some((p) => p._id.equals(post._id))) {
    try {
      const sess = await mongoose.startSession();
      sess.startTransaction();
      user.savedPosts.push(post);
      await user.save({ session: sess });
      await sess.commitTransaction();
      // await deleteAllCachedData();
    } catch (err) {
      const error = new HttpError(
        "Adding post to saved posts failed, please try again later.",
        500
      );
      return next(error);
    }
  } else {
    try {
      const sess = await mongoose.startSession();
      sess.startTransaction();
      user.savedPosts.pull(post);
      await user.save({ session: sess });
      await sess.commitTransaction();
      // await deleteAllCachedData();
    } catch (err) {
      const error = new HttpError(
        "Removing post from saved posts failed, please try again later.",
        500
      );
      return next(error);
    }
  }

  res.json({
    posts: user.savedPosts.toObject({ getters: true }),
  });
};

const getItinerary = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const userId = req.params.uid;
  const { location, nrDays, nrPersons } = req.body;

  try {
    await getCoordsForAddress(location);
  } catch (error) {
    return next(error);
  }

  let dayS;
  if (nrDays === "1") {
    dayS = "day";
  } else {
    dayS = "days";
  }

  try {
    let prompt = `We are ${nrPersons} persons and we would like to go to ${location} for ${nrDays} ${dayS}. Please recommend us 3 accomodation options and make a full itinerary for each day with the most important attractions.`;
    let fullText = "";

    while (true) {
      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: prompt,
        max_tokens: 500,
      });

      const generatedText = response.data.choices[0].text.trim();
      fullText += generatedText;

      if (response.data.choices[0].finish_reason !== "incomplete") {
        break;
      }

      prompt = `${prompt}\n${generatedText}`;
    }

    await sendEmail(userId, process.env.EMAIL_ITINERARY_SUBJECT, fullText);
    res.status(200).send({ message: "Email sent successfully!" });
  } catch (err) {
    return next(new HttpError(err.message, 500));
  }
};

const getRecommendations = async (req, res, next) => {
  try {
    const userId = req.params.uid;
    const recommendations = await recommendPlaces(userId, 3);

    if (recommendations.length !== 3) {
      return next(
        new HttpError("There is not enough data to make recommendations!", 503)
      );
    }

    let places = [];
    for (const rec of recommendations) {
      const place = await Place.findById(rec.placeId);
      places.push(place.address);
    }

    await sendEmail(userId, process.env.EMAIL_RECOMMENDATION_SUBJECT, places);
    res.status(200).send({ message: "Email sent successfully!" });
  } catch (err) {
    return next(err);
  }
};

const createPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { title, description, address, rating } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  let existingPlace;
  try {
    existingPlace = await Place.findOne({
      address: address,
      location: coordinates,
    });
  } catch (err) {
    return next(err);
  }

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    return next(
      new HttpError("Creating post failed, please try again later.", 500)
    );
  }

  if (!user) {
    return next(new HttpError("Could not find user for provided id.", 404));
  }

  let createdPlace;
  let closestCluster;
  if (existingPlace) {
    createdPlace = existingPlace;
  } else {
    const clusters = await Cluster.find().populate("places");
    let minDistance = Infinity;

    for (const cluster of clusters) {
      const distance = haversine(cluster.centroid, coordinates);
      if (distance < minDistance) {
        minDistance = distance;
        closestCluster = cluster;
      }
    }

    // Recalculate centroid
    const totalLat =
      closestCluster.centroid.lat * (closestCluster.places.length - 1) +
      coordinates.lat;
    const totalLng =
      closestCluster.centroid.lng * (closestCluster.places.length - 1) +
      coordinates.lng;

    closestCluster.centroid = {
      lat: totalLat / closestCluster.places.length,
      lng: totalLng / closestCluster.places.length,
    };

    createdPlace = new PlaceBuilder()
      .setAddress(address)
      .setLocation(coordinates)
      .setCluster(closestCluster._id)
      .build();

    closestCluster.places.push(createdPlace._id);
  }

  const createdPost = new Post({
    title,
    description,
    image: req.file.path,
    rating,
    likes: [],
    viewedBy: [],
    creator: req.userData.userId,
    place: createdPlace.id,
    comments: [],
  });

  try {
    //create a db transaction based on a session + create collection manually
    const sess = await mongoose.startSession();
    sess.startTransaction();

    if (!existingPlace) {
      await createdPlace.save({ session: sess });
    }
    await createdPost.save({ session: sess });
    user.createdPosts.push(createdPost);
    await user.save({ session: sess });
    if (closestCluster) {
      await Cluster.findByIdAndUpdate(closestCluster._id, closestCluster, {
        session: sess,
      });
    }
    await sess.commitTransaction();
    // await deleteAllCachedData();
  } catch (err) {
    const error = new HttpError(
      "Creating post failed, please try again later.",
      500
    );
    return next(error);
  }

  res.status(201).json({ post: createdPost });
};

const updatePost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { title, description, rating } = req.body;
  const postId = req.params.pid;

  let post;
  try {
    post = await Post.findById(postId).exec();
  } catch (err) {
    return next(
      new HttpError("Something went wrong, could not update post.", 500)
    );
  }

  if (post.creator.toString() !== req.userData.userId) {
    return next(new HttpError("You are not allowed to edit this post.", 401));
  }

  post.title = title;
  post.description = description;
  post.rating = rating;

  try {
    await post.save();
    if (post.rating !== rating) {
      // await deleteAllCachedData();
    }
  } catch (err) {
    return next(
      new HttpError("Something went wrong, could not update post.", 500)
    );
  }

  res.status(200).json({ post: post.toObject({ getters: true }) });
};

const deletePost = async (req, res, next) => {
  const postId = req.params.pid;
  let post;

  try {
    //+ ref to doc from other collection
    //mongoose takes creator and searches in users collection + get back its data to work with it
    post = await Post.findById(postId).populate("creator"); //bc we have place-user relation, can find user linked to place using creator field from place
  } catch (err) {
    return next(
      new HttpError("Something went wrong, could not delete post.", 500)
    );
  }

  if (!post) {
    return next(new HttpError("Could not find post for this id.", 404));
  }

  if (post.creator.id !== req.userData.userId) {
    return next(new HttpError("You are not allowed to delete this post.", 401));
  }

  const imagePath = post.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await post.remove({ session: sess });
    //work with the user, 'creator', associated to the place(from populate)
    post.creator.createdPosts.pull(post); // remove the place from the user's places array
    await post.creator.save({ session: sess });
    await sess.commitTransaction();
    // await deleteAllCachedData();
  } catch (err) {
    return next(
      new HttpError("Something went wrong, could not delete post.", 500)
    );
  }

  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  res.status(200).json({ message: "Deleted post." });
};

async function sendEmail(userId, subject, text) {
  let user;
  try {
    user = await User.findById(userId).lean();
  } catch (err) {
    throw new HttpError("Sending email failed, please try again later.", 500);
  }

  if (!user) {
    throw new HttpError("Could not find user for provided id.", 404);
  }

  // Set up Nodemailer transporter using Gmail service
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  if (Array.isArray(text)) {
    text = text.map((address) => `• ${address}`);
    text =
      "Based on yor activity, we think that you would like to visit the most :\n" +
      text.join("\n");
  }

  // Set up email options
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: subject,
    text: text,
  };

  try {
    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
  } catch (error) {
    throw new HttpError("Something went wrong, could not send the email.", 500);
  }
}

function toRadians(degree) {
  return degree * (Math.PI / 180);
}

function haversine(coord1, coord2) {
  const R = 6371e3; // Earth's radius in metres
  const lat1 = toRadians(coord1.lat);
  const lat2 = toRadians(coord2.lat);
  const deltaLat = toRadians(coord2.lat - coord1.lat);
  const deltaLng = toRadians(coord2.lng - coord1.lng);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  return distance;
}

// Schedule a task to run at 1 AM every day
const job = schedule.scheduleJob("0 1 * * *", async function () {
  console.log("Running clustering task...");
  const places = await Place.find();
  let locations = [];
  places.forEach((place) => {
    locations.push([place.location.lat, place.location.lng]);
  });
  const k = Math.ceil(places.length / 10);
  const result = kmeans(locations, k);

  // Initialize empty arrays for each cluster
  const clusterPlaces = new Array(result.centroids.length)
    .fill(0)
    .map(() => []);

  // Add each place to its corresponding cluster
  for (let i = 0; i < places.length; i++) {
    clusterPlaces[result.clusters[i]].push(places[i]._id);
  }

  // Create new clusters
  const newClusters = result.centroids.map((centroid, i) => {
    return new Cluster({
      centroid: {
        lat: centroid[0],
        lng: centroid[1],
      },
      places: clusterPlaces[i],
    });
  });

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await Cluster.deleteMany({}, { session: sess });
    await Cluster.insertMany(newClusters, {
      session: sess,
    });
    for (let i = 0; i < places.length; i++) {
      places[i].cluster = newClusters[result.clusters[i]]._id;
      await places[i].save({ session: sess });
    }
    await sess.commitTransaction();
    console.log("Task done with success!");
  } catch (err) {
    console.log("Something went wrong, couldn't recluster: " + err.message);
  }
});

exports.getPostById = getPostById;
exports.getPostsByUserId = getPostsByUserId;
exports.likePost = likePost;
exports.getSavedPosts = getSavedPosts;
exports.savePost = savePost;
exports.createPost = createPost;
exports.updatePost = updatePost;
exports.deletePost = deletePost;
exports.getRecommendations = getRecommendations;
exports.getItinerary = getItinerary;
