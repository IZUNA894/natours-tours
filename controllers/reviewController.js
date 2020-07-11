var Review = require("./../db/reviewModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

//creating a review
module.exports.create = catchAsync(async function(req, res, next) {
  //for facilating nesting routes,these properties are also available on req url...
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  const review = await Review.create(req.body);

  res.status(201).json({
    status: "success",
    data: review
  });
});

//getting all review
module.exports.getAll = catchAsync(async function(req, res, next) {
  //for facilating nesting routes,these properties are also available on req url...
  let filter = {};
  if (req.params.tourId) filter.tour = req.params.tourId;
  const reviews = await Review.find(filter); //.populate(["tour", "user"]);   ye bhi kr skte hai....but we will use middle ware

  res.status(200).json({
    status: "success",
    length: reviews.length,
    data: reviews
  });
});
