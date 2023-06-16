const User = require("../models/user");
const Post = require("../models/post");
const Place = require("../models/place");
const mongoose = require("mongoose");
const fs = require("fs");

async function getAllUsers() {
  try {
    await mongoose.connect(
      ``
    ); // mern = db name
    console.log("Successfully connected to db!");
    let users = [];
    const user1 = await User.findOne().sort({ $natural: 1 }).skip(396);
    const user2 = await User.findOne().sort({ $natural: 1 }).skip(249);
    const user3 = await User.findOne().sort({ $natural: 1 }).skip(338);
    users.push(user1, user2, user3);
    dataWrite = JSON.stringify(users);
    fs.appendFileSync(
      "C:\\users.txt",
      `${dataWrite}\n`
    );
  } catch (err) {
    console.log(err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database.");
  }
}

getAllUsers();
