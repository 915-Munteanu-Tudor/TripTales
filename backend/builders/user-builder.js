const User = require("../models/user");

class UserBuilder {
  constructor() {
    this.name = "";
    this.email = "";
    this.image = "";
    this.password = "";
    this.savedPosts = [];
    this.createdPosts = [];
    this.posts = [];
  }

  setName(name) {
    this.name = name;
    return this;
  }

  setEmail(email) {
    this.email = email;
    return this;
  }

  setImage(image) {
    this.image = image;
    return this;
  }

  setPassword(password) {
    this.password = password;
    return this;
  }

  setSavedPosts(posts) {
    this.savedPosts = posts;
    return this;
  }

  setCreatedPosts(posts) {
    this.createdPosts = posts;
    return this;
  }

  build() {
    return new User(this);
  }
}

module.exports = UserBuilder;
