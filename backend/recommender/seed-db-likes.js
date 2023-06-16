const mongoose = require("mongoose");
const User = require("../models/user");
const Post = require("../models/post");

async function seedLikes() {
  try {
    await mongoose.connect(
      ``
    ); // mern = db name
    console.log("Successfully connected to db!");

    const users = await User.find().lean();
    const posts = await Post.find().lean();

    const sess = await mongoose.startSession();
    sess.startTransaction();

    // Iterate over each user, like only posts not created by the user
    for (const user of users) {
      try {
        const availablePosts = posts.filter(
          (post) => post.creator.toString() !== user._id.toString()
        );

        const bulkOps = [];

        // Select 400 random posts to like
        for (let i = 0; i < 400; i++) {
          const randomIndex = Math.floor(Math.random() * availablePosts.length);
          const selectedPost = availablePosts[randomIndex];

          // Remove the selected post from the availablePosts array to avoid duplicate likes
          availablePosts.splice(randomIndex, 1);

          bulkOps.push({
            updateOne: {
              filter: { _id: selectedPost._id },
              update: { $addToSet: { likes: user._id } },
              session: sess
            }
          });
        }

        await Post.bulkWrite(bulkOps, { ordered: false });

      } catch (error) {
        console.error('Error processing user:', user._id, error.message);
        await sess.abortTransaction();
      }
    }

    await sess.commitTransaction();

    console.log("Likes seeding complete");
  } catch (error) {
    console.error("Error seeding likes:", error.message);
  } finally {
    mongoose.connection.close();
  }
}

seedLikes();
