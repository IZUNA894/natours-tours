const express = require("express");
const authController = require("./../controllers/authController");
const userController = require("./../controllers/userController");
const viewController = require("./../controllers/viewController");
const bookingController = require("./../controllers/bookingController");

var router = express.Router();

//
router.get("/", authController.isLoggedIn, viewController.getOverview);

router.get("/tour/:slug", authController.checkAuth, viewController.getTour);

router.get("/login", authController.isLoggedIn, viewController.login);

router.get("/me", authController.checkAuth, viewController.getMe);
router.get("/myBookings", authController.checkAuth, viewController.myBookings);
module.exports = router;
