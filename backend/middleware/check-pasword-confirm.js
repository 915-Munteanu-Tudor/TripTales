const HttpError = require("../models/http-error");

module.exports = (req, res, next) => {
  if (req.body.confirmPassword !== req.body.password) {
    return next(
      new HttpError("The password and its confirmation does not match.", 400)
    );
  }
  next();
};
