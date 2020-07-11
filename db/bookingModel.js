const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: "Tour",
    required: [true, "booking must have a tour"]
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "booking must have a user"]
  },
  price: {
    type: Number,
    required: [true, "price must be provides"]
  },
  paid: {
    type: Boolean,
    default: true
  },
  changedAt: {
    type: Date,
    default: Date.now()
  }
});

bookingSchema.pre(/^find/, function(next) {
  this.populate("user").populate({
    path: "tour",
    select: "name"
  });
  next();
});

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
