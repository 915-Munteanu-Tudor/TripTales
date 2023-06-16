const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const postSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  rating: {
    type: Number,
    integer: true,
    required: true,
    min: 1,
    max: 10,
  },
  likes: [{ type: mongoose.Types.ObjectId, required: true, ref: "User" }],
  viewedBy: [{ type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" }],
  creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  place: { type: mongoose.Types.ObjectId, required: true, ref: "Place" },
});

module.exports = mongoose.model("Post", postSchema);
