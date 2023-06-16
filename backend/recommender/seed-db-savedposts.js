const mongoose = require("mongoose");
const User = require("../models/user");
const Place = require("../models/place");
const Post = require("../models/post");

const savedPostsSize = 20;

async function seedSavedPosts() {
  try {
    await mongoose.connect(
      ``
    );
    console.log("Successfully connected to db!");

    const users = await User.find().lean();
    const posts = await Post.find().lean().populate("place");

    for (const user of users) {
      // Get the posts that the user has already created
      const createdPostIds = posts
        .filter((post) => post.creator.toString() === user._id.toString())
        .map((post) => post._id.toString());

      // Filter out the created posts
      const availablePosts = posts.filter(
        (post) => !createdPostIds.includes(post._id.toString())
      );

      // Select random posts with unique places
      const savedPosts = [];
      const usedPlaces = new Set();
      while (savedPosts.length < savedPostsSize && availablePosts.length > 0) {
        const randomIndex = Math.floor(Math.random() * availablePosts.length);
        const randomPost = availablePosts[randomIndex];
        const placeId = randomPost.place._id.toString();

        if (!usedPlaces.has(placeId)) {
          usedPlaces.add(placeId);
          savedPosts.push(randomPost._id);
        }

        // Remove the selected post from the availablePosts array
        availablePosts.splice(randomIndex, 1);
      }

      // Update the user's saved posts
      await User.updateOne(
        { _id: user._id },
        { $set: { savedPosts: savedPosts } }
      );
    }

    console.log("Saved posts seeded successfully!");
  } catch (err) {
    console.log(err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database.");
  }
}

seedSavedPosts();
