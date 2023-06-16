const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const clusterSchema = new Schema({
  centroid: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  places: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Place",
    },
  ],
});

module.exports = mongoose.model("Cluster", clusterSchema);
