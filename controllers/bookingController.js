const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Tour = require("./../db/tourModel");
const User = require("./../db/userModel");
const Booking = require("./../db/bookingModel");
const APIFeatures = require("./../utils/apiFeatures");
const AppError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");

//creating a checkout session ,calling stripe for payment.

//in production we will use geiven below function
module.exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //1.get current tour
  const tour = await Tour.findById(req.params.tourId);
  //2.create checkout session
  const Stripe = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    // success_url: `${req.protocol}://${req.hostname}:3000/?tourId=${tour._id}&userId=${req.user.id}&price=${tour.price}`,  this function is used in developement only...
    success_url: `${req.protocol}://${req.hostname}:3000/`,
    cancel_url: `${req.protocol}://${req.hostname}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [
          `${req.protocol}://${req.hostname}/img/tours/${tour.imageCover}`
        ],
        amount: tour.price * 100,
        currency: "usd",
        quantity: 1
      }
    ]
  });
  res.status(200).json({
    status: "success",
    Stripe
  });
});

//creating booking check out ,called by below function only
const createBookingCheckout = async session => {
  console.log("createBooking called");
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.line_items[0].amount / 100;
  // await Booking.create({ tour, user, price });
};
//creating a checkout (prduction),will called by stripe servers. not by  our app
module.exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers["stripe-signature"];
  console.log("function called");
  console.log(signature);
  if (!signature) return next();
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook error :${err.message}`);
  }
  console.log("event ", event.type);
  if (event.type === "checkout.session.completed") {
    console.log("hello");
    createBookingCheckout(event.data.object);
  }

  res.status(200).json({ received: true });
};

//creating a booking,when data is send through query string
//! this will be called from view router,when after successful payment,user is redirected to home page
//used in developement only,not in production
// module.exports.createBooking = catchAsync(async function(req, res, next) {
//   const { tourId, userId, price } = req.query;
//   if (!tourId || !userId || !price) return next();

//   await Booking.create({ tour: tourId, user: userId, price });
//   res.redirect(req.originalUrl.split("?")[0]);
// });

//getting all Tours
module.exports.getAllBookings = catchAsync(async (req, res, next) => {
  // Building query

  var bookings = new APIFeatures(Booking.find(), req.query)
    .filter()
    .sort()
    .selectingFields()
    .pagination();
  bookings = await bookings.query; //  hm yha query ke aage .explain() bhi lga skte hai....uske hme imp. stats milenge...index ke lie

  res.status(200).json({
    status: "success",
    length: bookings.length,
    data: {
      bookings
    }
  });
});

//creating booking
module.exports.createBooking = catchAsync(async (req, res, next) => {
  console.log(req.body);
  var newBooking = new Booking(req.body);
  var result = await newBooking.save();

  res.status(200).json({
    status: "success",
    data: {
      result
    }
  });
});

// getting a booking by id
module.exports.getBookingById = catchAsync(async (req, res, next) => {
  var bookings = await Booking.findById(req.params.id);

  if (!bookings) {
    return next(new AppError("cant find anything ", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      bookings
    }
  });
});

// updating booking by id
module.exports.updateBookingById = catchAsync(async (req, res, next) => {
  console.log(req.body);
  var booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!booking) {
    return next(new AppError("cant find anything ", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      booking
    }
  });
});

// delete booking By id
module.exports.deleteBookingById = catchAsync(async (req, res, next) => {
  var bookings = await Booking.findByIdAndRemove(req.params.id);

  if (!bookings) {
    return next(new AppError("cant find anything ", 404));
  }

  res.status(204).json({
    data: null
  });
});
