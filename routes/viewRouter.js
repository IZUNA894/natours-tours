const express = require("express");
const authController = require("./../controllers/authController");
const userController = require("./../controllers/userController");
const viewController = require("./../controllers/viewController");
const bookingController = require("./../controllers/bookingController");

var router = express.Router();

//getting home page
router.get("/", authController.isLoggedIn, viewController.getOverview);
//getting tour details
router.get("/tour/:slug", authController.checkAuth, viewController.getTour);
//login
router.get("/login", authController.isLoggedIn, viewController.login);
//signup
router.get("/signup", authController.isLoggedIn, viewController.signup);
//my account
router.get("/me", authController.checkAuth, viewController.getMe);
//showing bookings
router.get("/myBookings", authController.checkAuth, viewController.myBookings);
module.exports = router;
