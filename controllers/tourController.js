const multer = require("multer");
const sharp = require("sharp");
const Tour = require("./../db/tourModel");
const APIFeatures = require("./../utils/apiFeatures");
const AppError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");
//creating middlewares here......
//checking id (just for seeing how param middeware works,not use)
// exports.checkId = (req, res, next, val) => {
//   if (val > tours.length) {
//     return res.status(400).json({
//       status: "fail",
//       data: "invalid id"
//     });
//   }
//   next();
// };

//handlling images and resizing them
const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) cb(null, true);
  else cb(new AppError("please upload jpeg gif png image", 400));
};
const upload = multer({
  fileFilter: multerFilter,
  storage: multerStorage
});
//as we have to upload multiple images so we have to use upload.fields not upload.single
module.exports.uploadTourImages = upload.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 3 }
]);
{
  //n if we have to upload multiple images but of one type only
  //n upload.array('images',4)  =>give req.files
  //n whereaes
  //n upload.single('images') gives => req.file
}
module.exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // console.log(req.files);
  // console.log(JSON.stringify(req.body));
  //1. checking if user has not uploaded the images to updated
  if (!req.files.imageCover || !req.files.images) return next();

  //2.a. now ,resizing it,image cover
  req.body.imageCover = `tour-cover-${req.user.id}-${Date.now()}.jpg`;
  console.log(req.body.imageCover);
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  //2.b. now resizing the images
  //but as the function is async it will give pro...
  req.body.images = [];
  var promiseObj = req.files.images.map(async (file, index) => {
    let filename = `tour-${index + 1}-${req.user.id}-${Date.now()}.jpg`;

    await sharp(file.buffer)
      .resize(2000, 1333)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${filename}`);
    req.body.images.push(filename);
  });
  //now as it as return all promises ,so to resolve all
  await Promise.all(promiseObj);

  next();
});

// top-5-cheap
exports.alliasTopTours = (req, res, next) => {
  req.query.sort = "-ratingAverage,price";
  req.query.limit = "5";

  next();
};

//rotoures..........
//getting all Tours
exports.getAllTours = catchAsync(async (req, res, next) => {
  // Building query

  // var Query = Tour.find().where('difficulty').equals('easy').where('rating')equals();
  // var tours = await toursQuery;

  var tours = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .selectingFields()
    .pagination();
  tours = await tours.query; //  hm yha query ke aage .explain() bhi lga skte hai....uske hme imp. stats milenge...index ke lie

  res.status(200).json({
    status: "success",
    length: tours.length,
    data: {
      tours
    }
  });
});

//creating tour
exports.createTour = catchAsync(async (req, res, next) => {
  console.log(req.body);
  var newTour = new Tour(req.body);
  var result = await newTour.save();

  res.status(200).json({
    status: "success",
    data: {
      result
    }
  });
});

// getting a tour by id
exports.getTourById = catchAsync(async (req, res, next) => {
  var tours = await Tour.findById(req.params.id).populate("review");

  if (!tours) {
    return next(new AppError("cant find anything ", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      tours
    }
  });
});

// updating tour by id
exports.updateTourById = catchAsync(async (req, res, next) => {
  console.log(req.body);
  var tours = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!tours) {
    return next(new AppError("cant find anything ", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      tours
    }
  });
});

// delete tour By id
exports.deleteTourById = catchAsync(async (req, res, next) => {
  var tours = await Tour.findByIdAndRemove(req.params.id);

  if (!tours) {
    return next(new AppError("cant find anything ", 404));
  }

  res.status(204).json({
    data: null
  });
});

//creating aggregates for stats
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingAverage: { $gte: 4 } }
    },
    {
      $group: {
        _id: { $toUpper: "$difficulty" },
        numTours: { $sum: 1 },
        numRatings: { $sum: "$ratingsCount" },
        avgRatings: { $avg: "$ratingAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" }
      }
    },
    {
      $sort: { avgPrice: 1 }
    }
  ]);
  res.status(200).json({
    status: "succes",
    data: { stats }
  });
});

//creating aggregates for months stats
exports.getMonthsStats = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  console.log(year);
  const stats = await Tour.aggregate([
    {
      $unwind: "$startDates"
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numTourStarts: { $sum: 1 },
        tours: { $push: "$name" }
      }
    },

    {
      $addFields: { month: "$_id" }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: { numTourStarts: -1 }
    },
    {
      $limit: 12
    }
  ]);
  res.status(200).json({
    status: "succes",
    data: { stats }
  });
});

//getting a tour within given range
module.exports.getTourWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, units } = req.params;
  const [lat, lng] = latlng.split(",");
  const radius = units === "mi" ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) return next(new AppError("please specify lat n long", 400));

  const tour = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });
  res.status(200).json({
    status: "success",
    results: tour.length,
    data: tour
  });
});

//getting distances from user loc with tour
module.exports.getDistances = catchAsync(async function(req, res, next) {
  const { latlng, units } = req.params;
  const [lat, lng] = latlng.split(",");
  const multiplier = units === "mi" ? 0.000621731 : 0.001;
  if (!lat || !lng) return next(new AppError("please specify lat n long", 400));

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: "distance",
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: "success",
    results: distances.length,
    data: distances
  });
});
