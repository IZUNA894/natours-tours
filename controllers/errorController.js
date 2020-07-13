//const chalk = require("chalk");
const AppError = require("../utils/appError");

const sendErrorDev = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith("/api")) {
    console.log(err);
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }

  // B) RENDERED WEBSITE
  console.error("ERROR 💥", err);
  return res.status(err.statusCode).render("error", {
    title: "Something went wrong!",
    msg: err.message
  });
};

const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith("/api")) {
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    // B) Programming or other unknown error: don't leak error details
    // 1) Log error
    console.error("ERROR 💥", err);
    // 2) Send generic message
    return res.status(500).json({
      status: "error",
      message: "Something went very wrong!"
    });
  }

  // B) RENDERED WEBSITE
  // A) Operational, trusted error: send message to client
  if (err.isOperational) {
    console.log(err);
    return res.status(err.statusCode).render("error", {
      title: "Something went wrong!",
      msg: err.message
    });
  }
  // B) Programming or other unknown error: don't leak error details
  // 1) Log error
  console.error("ERROR 💥", err);
  // 2) Send generic message
  return res.status(err.statusCode).render("error", {
    title: "Something went wrong!",
    msg: "Please try again later."
  });
};

const handleCastErrorDb = err => {
  const message = `INVALID ${err.path}:${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateKeyErrorDb = err => {
  const message = ` ${JSON.stringify(
    err.keyValue
  )} is already taken.use something else`;
  return new AppError(message, 400);
};

const handleValidationErrorDb = err => {
  const message = Object.values(err)
    .map(x => {
      return x.properties.message;
    })
    .join(". ");

  return new AppError(message, 400);
};

const handleJWTError = err =>
  new AppError("Invalid token .please login again", 401);

const handleJWTExpiredError = err =>
  new AppError("Your token has expired", 401);

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "internal server error";

  if (process.env.ENVIRONMENT === "developement") {
    sendErrorDev(err, req, res);
  } else {
    //production
    let error = { ...err };
    error.message = err.message;

    if (error.kind === "ObjectId") error = handleCastErrorDb(error);
    if (error.code === 11000) error = handleDuplicateKeyErrorDb(error);
    if (error._message === "Tour validation failed")
      error = handleValidationErrorDb(error.errors);
    if (error.name === "JsonWebTokenError") error = handleJWTError(error);
    if (error.name === "TokenExpiredError")
      error = handleJWTExpiredError(error);
    sendErrorProd(error, req, res);
  }
};
