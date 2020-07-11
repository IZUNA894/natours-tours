const mongoose = require("mongoose");
const Tour = require("./tourModel");

const reviewSchema = new mongoose.Schema({
  review: {
    type: String,
    require: [true, "a review cant be empty"]
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: "Tour",
    require: [true, "a review must have a tour"]
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    require: [true, "a review must have a reviewer"]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

//making schema index such that no same user can create a 2nd review  for same tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// making statics method on reviewSchema,this method will runon entire model,unlike methods which run on only doc.
//function to calc rating abg for and tour n update the corresponding tour itself
reviewSchema.statics.calcAvgRating = async function(tourId) {
  //here this refers whole model.
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: "$tour",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" }
      }
    }
  ]);

  //console.log(stats);
  //now ,updating the tour mdb
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingAverage: stats[0].avgRating,
      ratingsCount: stats[0].nRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingAverage: 0,
      ratingsCount: 0
    });
  }
};

//middle ware to call calcAvgRating func
reviewSchema.post("save", function() {
  //post me next nhi hota
  // this-> doc ,this.constructor ->model
  this.constructor.calcAvgRating(this.tour);
});

//middle ware to call calcAvgRating func when review is updated or deleted
//findIdAndDelete
//findIdAndUpdate
//these two functions called actually findOneAnd...
reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne();
  next();
});
reviewSchema.post(/^findOneAnd/, async function() {
  await this.r.constructor.calcAvgRating(this.r.tour);
});

//populating tour and user
reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: "tour",
    select: "name"
  }).populate({
    path: "user",
    select: "name email photo"
  });
  next();
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
