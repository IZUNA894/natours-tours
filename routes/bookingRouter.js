const express = require("express");
const bookingController = require("./../controllers/bookingController");
const authController = require("./../controllers/authController");
var router = express.Router();

//testing
// router.get("/*", (req, res) => {
//   console.log("hello");
// });
//getting a checkout stripe session
router.get(
  "/checkout-session/:tourId",
  authController.checkAuth,
  bookingController.getCheckoutSession
);

//getting all tours
router.get(
  "/getAll",
  authController.checkAuth,
  bookingController.getAllBookings
);

// creating a booking
router.post("/create/booking", bookingController.createBooking);

//getting a booking by id
router.get("/find/booking/:id", bookingController.getBookingById);

// updating a booking by id
router.patch(
  "/booking/:id",
  authController.checkAuth,
  authController.restrictTo("admin", "lead-guide"),
  bookingController.updateBookingById
);

// deleting a booking by id
router.delete(
  "/booking/:id",
  authController.checkAuth,
  authController.restrictTo("admin", "lead-guide"),
  bookingController.deleteBookingById
);

module.exports = router;
