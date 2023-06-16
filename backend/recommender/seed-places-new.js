const mongoose = require("mongoose");
const Place = require("../models/place");
const Cluster = require("../models/cluster");
const { kmeans } = require("ml-kmeans");
const { getCoordsForAddress } = require("../util/location");
const fs = require("fs");

async function savePlaces() {
  let places = [];
  let locations = [];

  const filePath =
    "C:\\place_list.txt";
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const lines = fileContent.split("\n");

  for (const line of lines) {
    const address = line.trim();
    const location = await getCoordsForAddress(line);
    const lat = location.lat;
    const lng = location.lng;
    locations.push([lat, lng]);
    places.push({
      address,
      location: {
        lat,
        lng,
      },
    });
  }

  const k = 25;
  const result = kmeans(locations, k);

  // Assign the cluster labels to the places
  const clusteredPlaces = places.map((place, index) => {
    const clusterLabel = result.clusters[index];
    return { ...place, cluster: clusterLabel };
  });
  console.log("Places are clustered!");

  // Create an array of clusters with centroids and empty places arrays
  const clusters = result.centroids.map((centroid) => ({
    centroid: { lat: centroid[0], lng: centroid[1] },
    places: [],
  }));

  try {
    await mongoose.connect(
      ``
    ); // mern = db name
    console.log("Successfully connected to db!");

    const sess = await mongoose.startSession();
    sess.startTransaction();
    const savedClusters = await Cluster.insertMany(clusters, { session: sess });
    const clusteredPlacesWithIds = clusteredPlaces.map((place) => {
      const clusterId = savedClusters[place.cluster]._id;
      return { ...place, cluster: clusterId };
    });
    const savedPlaces = await Place.insertMany(clusteredPlacesWithIds, {
      session: sess,
    });

    // Update the clusters with the saved places' IDs
    savedPlaces.forEach((savedPlace) => {
      const clusterId = savedPlace.cluster;
      const cluster = savedClusters.find(
        (cluster) => cluster._id.toString() === clusterId.toString()
      );
      cluster.places.push(savedPlace._id);
    });

    for (const cluster of savedClusters) {
      await Cluster.findByIdAndUpdate(
        cluster._id,
        { places: cluster.places },
        { session: sess }
      );
    }
    await sess.commitTransaction();
    console.log("Places saved to database!");
  } catch (err) {
    console.log(err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database.");
  }
}

savePlaces();
