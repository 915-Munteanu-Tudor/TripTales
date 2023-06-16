const mongoose = require("mongoose");
const uniqueValidator = require('mongoose-unique-validator');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true }, //creates index for email => speed up query
  password: { type: String, required: true, minlength: 6 },
  image: { type: String, required: true },
  savedPosts: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Post' }],
  createdPosts: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Post' }]
});

userSchema.plugin(uniqueValidator); //unique email + fast query

module.exports = mongoose.model('User', userSchema);