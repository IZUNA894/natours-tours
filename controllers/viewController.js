var User = require("./../db/userModel");
var Tour = require("./../db/tourModel");
var Booking = require("./../db/bookingModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

module.exports.getOverview = catchAsync(async function(req, res, next) {
  const tours = await Tour.find();
  res.status(200).render("overview", {
    title: "All Tours",
    tours: tours
  });
});

module.exports.getTour = catchAsync(async function(req, res, next) {
  const { slug } = req.params;
  const tour = await Tour.find({ slug }).populate({
    path: "review",
    fields: "review rating user"
  });

  if (!tour)
    return next(new AppError("We cant find any tour with this name", 404));

  res.status(200).render("tour", {
    tour: tour[0]
  });
});

//login
module.exports.login = catchAsync(async (req, res, next) => {
  res.status(200).render("login");
});

//about me
module.exports.getMe = catchAsync(async (req, res, next) => {
  res.status(200).render("account", {
    user: req.user
  });
});

//getting my bookings
module.exports.myBookings = catchAsync(async (req, res, next) => {
  var bookings = await Booking.find({ user: req.user.id });
  //! look these carefully
  const tourIds = bookings.map(booking => booking.tour);

  const tours = await Tour.find({ _id: { $in: tourIds } });
  res.status(200).render("overview", {
    title: "my bookings",
    tours
  });
});
