const express = require("express");
const authController = require("./../controllers/authController");
const userController = require("./../controllers/userController");
const reviewController = require("./../controllers/reviewController");

var router = express.Router({ mergeParams: true });

//getting all reviews
router.get("/getAll", reviewController.getAll);

//creating a review
// as we have used mergeParams ,so we have access to :tourId here...
router.post(
  "/create",
  authController.checkAuth,
  authController.restrictTo("user", "admin"),
  reviewController.create
);

module.exports = router;
