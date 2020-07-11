class AppError extends Error {
  constructor(msg, statusCode) {
    super(msg);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4")
      ? "fail"
      : "internal server error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
