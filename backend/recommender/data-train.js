const cosineSimilarity = require("cosine-similarity");
const User = require("../models/user");
const Post = require("../models/post");
const Place = require("../models/place");
const fs = require("fs");

const { createClient } = require("redis");
const client = createClient({
  password: process.env.REDIS_LABS_KEY,
  socket: {
    host: process.env.REDIS_LABS_HOST,
    port: process.env.REDIS_LABS_PORT,
  },
});

async function getUserVisitedClusters(userId) {
  const cacheKey = `userVisitedClusters:${userId}`;
  const cacheData = await client.get(cacheKey);

  if (cacheData) {
    return new Set(JSON.parse(cacheData));
  }

  const userPosts = await Post.find({ creator: userId })
    .lean()
    .populate("place");

  const visitedClusters = new Set();
  for (const post of userPosts) {
    visitedClusters.add(post.place.cluster.toString());
  }

  await client.set(cacheKey, JSON.stringify(Array.from(visitedClusters)), {
    EX: 5400,
    NX: true,
  }); // Cache for 1 and a half hour
  return visitedClusters;
}

async function prepareUserItemMatrix() {
  const cacheKey = "userItemMatrix";
  const cacheData = await client.get(cacheKey);

  if (cacheData) {
    return JSON.parse(cacheData);
  }

  const users = await User.find().lean().populate("savedPosts");
  const posts = await Post.find().lean().populate("place");

  // Group posts by place => lists of posts with same place
  const placePostsMap = posts.reduce((acc, post) => {
    if (!acc[post.place._id]) {
      acc[post.place._id] = [];
    }
    acc[post.place._id].push(post);
    return acc;
  }, {});

  // Aggregate ratings, likes, and view counts for each place
  const places = Object.values(placePostsMap).map((placePosts) => {
    const placeId = placePosts[0].place._id.toString();
    const ratings = [];
    const likes = [];
    const savedPosts = [];
    const viewedBy = new Set();

    // take the mean of the ratings of a user for that place !!!
    const userRatings = placePosts.reduce((acc, post) => {
      if (!acc[post.creator]) {
        acc[post.creator] = { total: post.rating, count: 1 };
      } else {
        acc[post.creator].total += post.rating;
        acc[post.creator].count += 1;
      }
      return acc;
    }, {});

    for (const userId in userRatings) {
      ratings.push({
        userId,
        rating: userRatings[userId].total / userRatings[userId].count,
      });
    }

    for (const post of placePosts) {
      likes.push(...post.likes.map((like) => ({ userId: like.toString() })));
      post.viewedBy.forEach((userId) => viewedBy.add(userId));
    }

    // if the user has a saved post which is in the list of posts about the same place, add it
    const usersWithPlaceInSavedPosts = users.filter((user) =>
      user.savedPosts.some((savedPost) =>
        placePosts.some((post) => post._id.toString() === savedPost.toString())
      )
    );
    savedPosts.push(
      ...usersWithPlaceInSavedPosts.map((user) => user._id.toString())
    );

    return {
      placeId,
      cluster: placePosts[0].place.cluster,
      ratings,
      likes,
      savedPosts,
      viewedBy: Array.from(viewedBy),
    };
  });

  // Create user-item matrix based on places
  const matrix = await Promise.all(
    users.map(async (user) => {
      const visitedClusters = await getUserVisitedClusters(user._id);

      return places.map((place) => {
        const userRating = place.ratings.find(
          (rating) => rating.userId === user._id.toString()
        );
        const rating = userRating ? userRating.rating : 0;
        const userLiked = place.likes.some(
          (like) => like.userId === user._id.toString()
        );
        const likeBonus = userLiked ? 1 : 0;
        const scalingFactor = 30;
        const viewWeight =
          place.viewedBy.length > 0
            ? 1 + Math.log10(place.viewedBy.length) / scalingFactor
            : 1;
        const clusterBonus = visitedClusters.has(place.cluster.toString())
          ? 0.7
          : 0;
        const savedPostsBonus = place.savedPosts.some(
          (savedPostUser) => savedPostUser === user._id.toString()
        )
          ? 1.35
          : 0;

        return Math.min(
          10,
          (rating + likeBonus + clusterBonus + savedPostsBonus) * viewWeight
        );
      });
    })
  );

  const result = {
    matrix,
    userMap: users.map((user) => user._id.toString()),
    placeMap: places.map((place) => place.placeId),
  };

  await client.set(cacheKey, JSON.stringify(result), {
    EX: 5400,
    NX: true,
  }); // Cache for 1 and a half hour
  return result;
}

async function recommendPlaces(userId, k) {
  if (!client.isOpen) {
    await client.connect();
  }

  const cacheKey = `recommendPlaces:${userId}:${k}`;
  const cacheData = await client.get(cacheKey);

  if (cacheData) {
    return JSON.parse(cacheData);
  }

  const { matrix, userMap, placeMap } = await prepareUserItemMatrix();
  const userIndex = userMap.indexOf(userId);

  if (userIndex === -1) {
    throw new Error("User not found");
  }

  const userPosts = await Post.find({ creator: userId })
    .lean()
    .populate("place");

  const visitedPlaceIds = new Set(
    userPosts.map((post) => post.place._id.toString())
  );

  //recommend popular places for not enough user data/interactions
  const userInteractionsThreshold = 10;
  if (
    matrix[userIndex].filter((rating) => rating > 0).length <
    userInteractionsThreshold
  ) {
    const popularPlaces = await getPopularPlaces(k, visitedPlaceIds);
    return popularPlaces;
  }

  // Use cosine similarity for user-based collaborative filtering
  const similarities = matrix.map((user, index) => ({
    index,
    similarity: cosineSimilarity(matrix[userIndex], user),
  }));

  // Sort the similarities in descending order and take the top k items
  const topKSimilarities = similarities
    .sort((a, b) => b.similarity - a.similarity)
    .filter((item) => item.index !== userIndex)
    .slice(0, k);

  const userBias =
    matrix[userIndex].reduce((sum, rating) => sum + rating, 0) /
    matrix[userIndex].filter((rating) => rating > 0).length;
  const itemBiases = matrix[0].map((_, i) => {
    const nonZeroRatings = matrix
      .map((row) => row[i])
      .filter((rating) => rating > 0);
    return (
      nonZeroRatings.reduce((sum, rating) => sum + rating, 0) /
      nonZeroRatings.length
    );
  });

  const similaritySum = topKSimilarities.reduce((sum, { similarity }) => {
    return sum + Math.abs(similarity);
  }, 0);

  const predictedRatings = matrix[userIndex].map((rating, postIndex) => {
    if (rating !== 0) return 0; // exclude visited

    const weightedSum = topKSimilarities.reduce(
      (sum, { index, similarity }) => {
        return (
          sum + (matrix[index][postIndex] - itemBiases[postIndex]) * similarity
        );
      },
      0
    );

    const randomizationFactor = 0.25;

    const predictedRating = userBias + weightedSum / similaritySum;
    const randomizedRating =
      similaritySum !== 0
        ? predictedRating +
          Math.random() * randomizationFactor -
          randomizationFactor / 2
        : 0;
    return randomizedRating;
  });

  const minRating = 1;
  const maxRating = 10;

  const scaledRatings = predictedRatings.map((rating, index) => {
    if (rating === 0) return 0;
    const userPredictedRatings = predictedRatings.filter((r) => r > 0);
    const zScore = zScoreNormalization(userPredictedRatings, rating);
    const scaledRating =
      minRating + ((zScore + 2) / 4) * (maxRating - minRating);
    return Math.min(scaledRating, maxRating);
  });

  // Map the predicted ratings to place IDs
  const recommendedPlaces = scaledRatings.map((rating, index) => ({
    placeId: placeMap[index],
    predictedRating: rating,
  }));

  // Filter out visited places
  const unvisitedRecommendedPlaces = recommendedPlaces.filter(
    (place) => !visitedPlaceIds.has(place.placeId)
  );

  // Sort the recommended places by predicted ratings in descending order and take the top k
  const topKRecommendedPlaces = unvisitedRecommendedPlaces
    .sort((a, b) => b.predictedRating - a.predictedRating)
    .slice(0, k);

  await client.set(cacheKey, JSON.stringify(topKRecommendedPlaces), {
    EX: 5400,
    NX: true,
  }); // Cache for 1 and a half hour

  // const dataWrite = JSON.stringify(topKSimilarities);
  // fs.appendFileSync(
  //   "recommender/topKSimilarities.txt",
  //   `User: ${userId}\n${dataWrite}\n\n`
  // );

  return topKRecommendedPlaces;
}

function zScoreNormalization(array, value) {
  const mean = array.reduce((sum, v) => sum + v, 0) / array.length;
  const stdDev = Math.sqrt(
    array.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / array.length
  );
  return (value - mean) / stdDev;
}

async function getPopularPlaces(k, visitedPlaceIds) {
  const places = await Place.find().lean();
  const posts = await Post.find().lean().populate("place");

  const placePopularityMap = posts.reduce((acc, post) => {
    if (!acc[post.place._id]) {
      acc[post.place._id] = { views: 0, likes: 0 };
    }
    acc[post.place._id].views += post.viewedBy.length;
    acc[post.place._id].likes += post.likes.length;
    return acc;
  }, {});

  const viewWeight = 1;
  const likeWeight = 1.5;

  const placePopularityList = places.map((place) => {
    const placePopularity = placePopularityMap[place._id] || {
      views: 0,
      likes: 0,
    };
    return {
      placeId: place._id,
      popularity:
        placePopularity.views * viewWeight + placePopularity.likes * likeWeight,
      // views: placePopularity.views,
      // likes: placePopularity.likes,
    };
  });

  const sortedPopularPlaces = placePopularityList
    .filter((place) => !visitedPlaceIds.has(place.placeId.toString()))
    .sort((a, b) => b.popularity - a.popularity);
  const topKPopularPlaces = sortedPopularPlaces.slice(0, k);

  return topKPopularPlaces;
}

async function deleteAllCachedData() {
  try {
    if (!client.isOpen) {
      await client.connect();
    }
    await client.flushAll();
    console.log("All cached data deleted");
  } catch (error) {
    console.error("Error deleting cached data:", error);
  }
}

module.exports = {
  recommendPlaces,
  deleteAllCachedData,
};
