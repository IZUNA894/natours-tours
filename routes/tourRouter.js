const express = require("express");
const tourController = require("./../controllers/tourController");
const authController = require("./../controllers/authController");
const reviewRouter = require("./../routes/reviewRouter");
var router = express.Router();

//middleware
// router.param("id", tourController.checkId);

//getting all tours
router.get("/tours", authController.checkAuth, tourController.getAllTours);

// creating a tour by id
router.post("/create/tour", tourController.createTour);

//getting a tour by id
router.get("/find/tour/:id", tourController.getTourById);

// updating a tour by id
router.patch(
  "/tour/:id",
  authController.checkAuth,
  authController.restrictTo("admin", "lead-guide"),
  tourController.uploadTourImages,
  tourController.resizeTourImages,
  tourController.updateTourById
);

// deleting a tour by id
router.delete(
  "/tour/:id",
  authController.checkAuth,
  authController.restrictTo("admin", "lead-guide"),
  tourController.deleteTourById
);

//getting top 5 tours
router.get(
  "/tours/top-5-cheap",
  tourController.alliasTopTours,
  tourController.getAllTours
);

//get stats tours
router.get("/tours/getstats", tourController.getTourStats);

// get tours stats by months
router.get("/tours/getMonthsStats/:year", tourController.getMonthsStats);

//creating a review in tour
// //router.post(
// // "/tours/:tourId/review",
// // authController.checkAuth,
// //   authController.restrictTo("user"),
// //  reviewController.create
// //);
//instead we wiil use here express merge params prop.
router.use("/tours/:tourId/review", reviewRouter);

//getting a tour within a spcified range
router.get(
  "/tours/located-within/:distance/latlng/:latlng/units/:units",
  tourController.getTourWithin
);

//getting a distances in user loc wiith tour
router.get(
  "/tours/distances/:latlng/units/:units",
  tourController.getDistances
);

module.exports = router;
