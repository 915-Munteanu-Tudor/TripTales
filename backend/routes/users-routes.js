const express = require("express");
const { check } = require("express-validator");
const usersController = require("../controllers/users-controller");
const fileValidation = require("../middleware/file-upload");
const checkAuth = require("../middleware/check-auth");
const checkPasswordConfirm = require("../middleware/check-pasword-confirm");

const router = express.Router();

router.get("/", usersController.getUsers);

router.get("/searchUsers/:sqry", usersController.searchUsers);

router.post(
  "/signup",
  fileValidation.fileUpload.single("image"),
  fileValidation.isValidMimeType,
  checkPasswordConfirm,
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password")
      .matches(
        /^(?=(.*[a-z]){1,})(?=(.*[A-Z]){1,})(?=(.*[0-9]){1,})(?=(.*[!@#$%^&*()-_+=.,?<>:;'\"\\|]){1,}).{8,}$/
      )
      .withMessage(
        "Password must contain at least 1 uppercase, 1 lowercase, 1 digit, 1 special character, 8 characters."
      ),
  ],
  usersController.signup
);

router.post("/login", usersController.login);

router.use(checkAuth);

router.post(
  "/changepassword/:uid",
  checkPasswordConfirm,
  [
    check("oldPassword").not().isEmpty(),
    check("password")
      .matches(
        /^(?=(.*[a-z]){1,})(?=(.*[A-Z]){1,})(?=(.*[0-9]){1,})(?=(.*[!@#$%^&*()-_+=.,?<>:;'\"\\|]){1,}).{8,}$/
      )
      .withMessage(
        "Password must contain at least 1 uppercase, 1 lowercase, 1 digit, 1 special character, 8 characters."
      ),
  ],
  usersController.changePassword
);

module.exports = router;
