const mongoose = require("mongoose");
const slugify = require("slugify");

var tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name of tour must be provide"],
      unique: true,
      maxlength: [40, "name must be smaller than 40"],
      minlength: [10, "name must be larger than 10"]
    },
    price: {
      type: Number,
      required: [true, "price of tour must be provide"]
    },
    ratingAverage: {
      type: Number,
      default: 4.5,
      min: 1,
      max: 5,
      set: val => Math.round(val * 10) / 10 //here set will just before setting the value
    },
    ratingsCount: {
      type: Number,
      default: 0
    },
    duration: {
      type: Number,
      required: [true, "duration must be required"]
    },
    maxGroupSize: {
      type: Number,
      required: [true, "maxGroupSize of tour must be provide"]
    },
    difficulty: {
      type: String,
      required: [true, "difficulty of tour must be provide"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty either be:easy ,hard or medium"
      }
    },
    summary: {
      type: String,
      required: [true, "summary of tour must be provide"]
    },
    description: {
      type: String,
      trim: true
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          return val < this.price;
        },
        message: "price discount must be less than real price"
      }
    },
    imageCover: {
      type: String,
      trim: true
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      // ***************note*************if we use select:false then it will not be shown in query result.
      select: false
    },
    startDates: [Date],
    slug: String,
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      type: {
        type: String,
        default: "Point",
        enum: ["Point"]
      },
      description: String,
      address: String,
      coordinates: [Number]
    },
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"]
        },
        description: String,
        address: String,
        coordinates: [Number],
        day: Number
      }
    ],
    // guides: Array this will be used when we want embed ,with the middleware below
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User"
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
//setting indexes...this could be helpful in big db....its tell db how to keep track of doc. on what basis of waht field
// tourSchema.index({ price: 1 });
// tourSchema.index({price:1,ratingAverage:-1});     //-1 for des,1 for asc , n this is compund index.
tourSchema.index({ startLocation: "2dsphere" });

tourSchema.virtual("durationWeeks").get(function() {
  return this.duration / 7;
});

// now,here we are doing parent refrencing.meaning by kin kin  review doc me tour doc ko ref kia hai...unhe yha populate krenge but virtually
// as ye review vali field hmne is model me add nhi krni....
tourSchema.virtual("review", {
  ref: "Review", //kis model se populate krna hai
  foreignField: "tour", //us model ki konsi field se check krna hai
  localField: "_id" //ab us  model ki field ki value ,is model me kis field se compare se honi chahiye
});

// Document middel ware:run on .save n .create
tourSchema.pre("save", function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//embedding the guides in this model from user model
// tourSchema.pre("save", async function(next) {
//   const guidePromise = this.guides.map(async guide => {
//     return await User.findById(guide);
//   });
//   this.guides = await Promise.all(guidePromise);
//   next();
// });

// running on save n create only ,not on update or insert
// tourSchema.pre('save',function(next){
//   console.log("blaaja")

// });

// tourSchema.post('save',function(next){
//   console.log("running after save'")
// })

// Querry middle ware
// !this will run on query,obj produced by find() when u dont use await in it.
// !as there are very methods in started by find..(),but 'find' will run on 'find()' only so we are using a regex here
// !same can be run on post
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

//populating guide field with user data
tourSchema.pre(/^find/, function(next) {
  // !ye populate wala method tum find qali query me bhi use kr skte ho...but ye query me hi kaam krega...
  this.populate({
    path: "guides",
    select: "-__v -passwordChangedAt -password"
  });
  next();
});

// AGGREGATION middle ware ,run on .aggregate
// tourSchema.pre("aggregate", function(next) {
//   //as aggregate containe pipeline of objects,so we have to push instead of using this.

//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

var Tour = mongoose.model("Tour", tourSchema);
module.exports = Tour;
