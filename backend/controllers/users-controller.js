const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { deleteAllCachedData } = require("../recommender/data-train");
const HttpError = require("../models/http-error");
const User = require("../models/user");
const UserBuilder = require("../builders/user-builder");

const getUsers = async (req, res, next) => {
  let users;

  try {
    users = await User.find({}, "-password"); // all documents of users without password field
  } catch (err) {
    return next(
      new HttpError("Fetching users failed, please try again later.", 500)
    );
  }
  res.json({ users: users.map((u) => u.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }
  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return next(
      new HttpError("Signing up failed, please try again later.", 500)
    );
  }

  if (existingUser) {
    return next(
      new HttpError("User exists already, please login instead.", 422)
    );
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12); //salt rounds
  } catch (err) {
    const error = new HttpError(
      "Could not create the user, please try again later.",
      500
    );
    return next(error);
  }

  const createdUser = new UserBuilder()
    .setName(name)
    .setEmail(email)
    .setImage(req.file.path)
    .setPassword(hashedPassword)
    .setSavedPosts([])
    .setCreatedPosts([])
    .build();

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdUser.save({ session: sess });
    await sess.commitTransaction();
    await deleteAllCachedData();
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    ); //gets a payload
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token: token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return next(
      new HttpError("Logging in failed, please try again later", 500)
    );
  }

  if (!existingUser) {
    return next(
      new HttpError("Invalid credentials, could not log you in.", 403)
    );
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    return next(
      new HttpError(
        "Could not log you in, please check your credentials and try again.",
        500
      )
    );
  }

  if (!isValidPassword) {
    return next(
      new HttpError("Invalid credentials, could not log you in.", 403)
    );
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    ); //gets a payload
  } catch (err) {
    const error = new HttpError(
      "Logging in failed, please try again later",
      500
    );
    return next(error);
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token,
  });
};

const changePassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }
  const { oldPassword, password } = req.body;
  const userId = req.params.uid;

  let existingUser;
  try {
    existingUser = await User.findById(userId);
  } catch (err) {
    return next(
      new HttpError("Could not find the user, please try again later.", 500)
    );
  }

  if (!existingUser) {
    return next(new HttpError("Could not find user for provided id.", 404));
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(oldPassword, existingUser.password);
  } catch (err) {
    return next(
      new HttpError(
        "Could not change your password, please check your credentials and try again.",
        500
      )
    );
  }

  if (!isValidPassword) {
    return next(new HttpError("The old password is incorrect.", 403));
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      "Could not create the new password, please try again later.",
      500
    );
    return next(error);
  }

  existingUser.password = hashedPassword;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await existingUser.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Changing password failed, please try again later.",
      500
    );
    return next(error);
  }

  res.status(200).json({});
};

const searchUsers = async (req, res, next) => {
  const sqry = req.params.sqry.trim();
  if (!sqry || sqry === "") {
    return res.status(400).json({ message: "Invalid search query." });
  }

  let users;
  try {
    users = await User.find(
      { name: { $regex: sqry, $options: "i" } },
      "-password"
    );
  } catch (err) {
    return next(
      new HttpError("Fetching users failed, please try again later.", 500)
    );
  }
  res.json({ users: users.map((u) => u.toObject({ getters: true })) });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
exports.changePassword = changePassword;
exports.searchUsers = searchUsers;
