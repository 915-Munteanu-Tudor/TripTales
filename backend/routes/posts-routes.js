const express = require("express");
const { check } = require("express-validator");
const fileValidation = require("../middleware/file-upload");
const postsControllers = require("../controllers/posts-controller");
const checkAuth = require("../middleware/check-auth");
const router = express.Router();

router.get("/:pid", postsControllers.getPostById);

router.get("/user/:uid1/:uid2?", postsControllers.getPostsByUserId);

router.use(checkAuth);

router.get("/savedposts/:uid", postsControllers.getSavedPosts);

router.post("/recommend/:uid", postsControllers.getRecommendations);

router.post(
  "/",
  fileValidation.fileUpload.single("image"),
  fileValidation.isValidMimeType,
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
    check("rating").not().isEmpty().isInt({ min: 1, max: 10 }),
  ],
  postsControllers.createPost
);

router.post(
  "/itinerary/:uid",
  [
    check("location").not().isEmpty(),
    check("nrDays").not().isEmpty().isInt({ min: 1, max: 15 }),
    check("nrPersons").not().isEmpty().isInt({ min: 1, max: 15 }),
  ],
  postsControllers.getItinerary
);

router.post("/like/:pid/:uid", postsControllers.likePost);

router.post("/savepost/:pid/:uid", postsControllers.savePost);

router.patch(
  "/:pid",
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("rating").not().isEmpty().isInt({ min: 1, max: 10 }),
  ],
  postsControllers.updatePost
);

router.delete("/:pid", postsControllers.deletePost);

module.exports = router;
