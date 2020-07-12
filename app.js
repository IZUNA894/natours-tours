const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const MongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const cors = require("cors");

require("./db/mongo");
const bookingRouter = require("./routes/bookingRouter");
const tourRouter = require("./routes/tourRouter");
const userRouter = require("./routes/userRouter");
const reviewRouter = require("./routes/reviewRouter");
const viewRouter = require("./routes/viewRouter");
const bookingController = require("./controllers/bookingController");
const AppError = require("./utils/appError.js");
const globalErrorController = require("./controllers/errorController");

const app = express();

const limiter = rateLimit({
  max: 100,
  message: "too many limits ,try again in an hour",
  windowMs: 60 * 60 * 1000 //time
});
// middleWARE
//for security headers
app.use(helmet());
//for limiting reqest by ip
app.use("/api", limiter);
//for serving static files
app.use(express.static(`${__dirname}/public`));
//for logging req
app.use(morgan("dev"));
//integrating stripe checkout,have to before json parser
app.get(
  "/webhook-checkout",
  express.raw({ type: "application/json" }),
  bookingController.webhookCheckout
);
//for parsing json into req.body
app.use(express.json({ limit: "10kb" }));
//for parsing cookies
app.use(cookieParser());
//for filtering out Nosql querry injection
app.use(MongoSanitize());
//for filtering out XSS scripts
app.use(xss());
//preventing parameter pollution
app.use(
  hpp({
    whitelist: ["duration", "price"]
  })
);
//for trusting proxy on heroku and production
app.enable("trust proxy");
//setting view engine
app.set("view engine", "pug");
app.set("views", `${__dirname}/views`);
//using cors
app.use(cors());
app.options("*", cors());
//for parsing data that is coming from form
app.use(express.urlencoded({ extended: true }));

// making routes here

// app.get(
//   "/api/v1/bookings/checkout-session/5c88fa8cf4afda39709c2955",
//   (req, res) => {
//     console.log("hello");
//   }
// );
//views
app.use("/", viewRouter);
//user
app.use("/api/v1", userRouter);
//tour
app.use("/api/v1", tourRouter);
//review
app.use("/api/v1/review", reviewRouter);

//bokings
app.use("/api/v1/bookings", bookingRouter);

//when no page is match
app.all("*", (req, res, next) => {
  // res.status(404).json({
  //   status: "fail",
  //   message: "cant find anything"
  // });

  // const err = new Error("cant find anything with your requested url");
  // err.statusCode = 400;
  // err.status = "not found";

  next(new AppError("cant find anything with your requested url", 404));
});

//error handling middle middleWARE
app.use(globalErrorController);
module.exports = app;
