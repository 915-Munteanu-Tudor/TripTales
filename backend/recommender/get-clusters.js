const mongoose = require("mongoose");
const Cluster = require("../models/cluster");
const Post = require("../models/post");
const User = require("../models/user");
const fs = require("fs");

async function getClusters() {
  try {
    await mongoose.connect(
      ``
    ); // mern = db name
    console.log("Successfully connected to db!");

    const clusters = await Cluster.find();

    let centroids = [];
    for (const cluster of clusters) {
      centroids.push({
        id: cluster._id,
        lat: cluster.centroid.lat,
        lng: cluster.centroid.lng,
      });
    }
    const dataWrite = JSON.stringify(centroids);
    fs.appendFileSync(
      "C:\\clusters.txt",
      `${dataWrite}\n\n`
    );
  } catch (err) {
    console.log(err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database.");
  }
}

getClusters();
