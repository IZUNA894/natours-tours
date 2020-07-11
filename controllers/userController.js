const multer = require("multer");
const sharp = require("sharp");
var User = require("./../db/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
// ! we will not gonna use this anymore...as this function will write into the disk system,but
// ! before we neeed to process it resiz it ,after that we will save it to disk
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "public/img/users");
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split("/")[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });

//! instead we use to prefer in memory buffer itself
const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) cb(null, true);
  else cb(new AppError("please upload jpeg gig png image", 400));
};
const upload = multer({
  fileFilter: multerFilter,
  storage: multerStorage
});
module.exports.uploadPic = upload.single("photo");
module.exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  //if user hasnt requested to change photo
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

//update uuser
module.exports.updateMe = catchAsync(async function(req, res, next) {
  //1.if user is trying to change password,
  if (req.body.password || req.body.confirmPassword)
    return next(
      new AppError("Sorry ,password change is not allowed here", 400)
    );

  //2. filter field from req
  const allowedFields = ["email", "name"];
  const reqFields = Object.keys(req.body);
  let filterObj = {};
  reqFields.forEach(field => {
    if (allowedFields.includes(field)) filterObj[field] = req.body[field];
  });
  if (req.file) filterObj.photo = req.file.filename;

  //3. now updating the db
  const user = await User.findByIdAndUpdate(req.user.id, filterObj, {
    runValidators: true,
    new: true
  });
  res.status(201).json({
    status: "success",
    data: user
  });
});

//delete a user , actually just setting it unactive
module.exports.deleteMe = catchAsync(async function(req, res, next) {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "success"
  });
});

//getting all users
module.exports.getAllUsers = catchAsync(async function(req, res, next) {
  const users = await User.find();

  res.status(200).json({
    status: "success",
    data: users
  });
});

//getting me
module.exports.getMe = catchAsync(async function(req, res, next) {
  const id = req.user.id;
  const user = await User.findById(id);

  res.status(200).json({
    status: "success",
    data: user
  });
});
