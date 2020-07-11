const jwt = require("jsonwebtoken");
const { promisify } = require("util");

var User = require("./../db/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const crypto = require("crypto");
const Email = require("./../utils/email");
//creaitng a user
module.exports.createUser = catchAsync(async (req, res, next) => {
  let user = new User(req.body);
  user = await user.save();
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.EXPIRES_IN
  });

  const url = `${req.protocol}://${req.hostname}/me`;
  console.log(url);
  await new Email(user, url).sendWelcome();

  res.cookie("jwt", token, {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: process.env.COOKIE_SECURE === "true",
    httpOnly: true
  });
  //! if deploying to heroku ,use this for setting cookie.secure
  //// if( req.secure === "true" || req.headers['x-forwarded-proto] === 'https') then set it true
  res.status(201).json({
    status: "succes",
    token,
    data: user
  });
});

//login a usr
module.exports.loginUser = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(new AppError("please provide email and password", 400));

  //cehck if user exist and password is correct
  const user = await User.findOne({ email }).select("+password");

  let passwordIsCorrect = "";
  if (user)
    passwordIsCorrect = await user.checkPassword(password, user.password);

  if (!user || !passwordIsCorrect)
    return next(new AppError("incorrect email or password", 400));

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.EXPIRES_IN
  });

  res.cookie("jwt", token, {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: process.env.COOKIE_SECURE === "true",
    httpOnly: true
  });
  res.status(201).json({
    status: "success",
    token,
    data: user
  });
});

//for logging out
module.exports.logout = catchAsync(async (req, res, next) => {
  res.cookie("jwt", "", {
    expires: new Date(Date.now() + 10 * 1000),
    secure: process.env.COOKIE_SECURE === "true",
    httpOnly: true
  });
  res.status(201).json({
    status: "success"
  });
});
//for checking auth
module.exports.checkAuth = catchAsync(async (req, res, next) => {
  //1. checking the token n if its there
  let token = "";
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(new AppError("your are not login", 401));
  }
  //2. checking if token is correct or not
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3. checking if user in db
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(new AppError("this User is no longer exist", 401));

  //4. if user has changed the passed after the token has been issued
  if (await currentUser.changedPasswordAfter(decoded.iat))
    return next(
      new AppError("User recently changed the password.Please login again", 401)
    );

  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

//for checking if user is logged in,for rendering pages,no error
module.exports.isLoggedIn = catchAsync(async (req, res, next) => {
  //1. checking the token n if its there
  let token = "";
  if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next();
  }
  //2. checking if token is correct or not
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3. checking if user in db
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) return next();

  res.locals.user = currentUser;
  return next();
});

//for restricting permission of user
module.exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("you dont have permission to do this action", 403)
      );
    }
    next();
  };
};

//forgot password
module.exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  //1.check of emailid
  if (!email) return next(new AppError("please give your email id", 400));

  //2.find user in db
  const user = await User.findOne({ email });
  if (!user) return next(new AppError("we cant find your account", 404));

  //3 . generate random reset token
  const token = await user.createResetToken();
  await user.save({ validateBeforeSave: false });

  //4.send to user email

  try {
    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/resetPassword/${token}`;
    await new Email(user, resetUrl).sendResetUrl();

    res.status(200).json({
      status: "success",
      data: "token has been sent to your email"
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError("error in sending in token", 500));
  }
});
//for rseting a pasword when forgot password was clicked
module.exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1 .get user based on Token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2. if token has not expired,and there is a user ,set the new password
  if (!user) return next(new AppError("invalid token or expired", 400));
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save(); //here we can do .update also ,but it will not run any validators and db middleware

  // 3. update changedPasswordAt in db
  //=> this will be done in db middelware

  //4. log in the user , send JWT
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.EXPIRES_IN
  });

  res.cookie("jwt", token, {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: process.env.COOKIE_SECURE === "true",
    httpOnly: true
  });

  res.status(200).json({
    status: "success",
    token: token
  });
});

//for updating password
module.exports.updatePassword = catchAsync(async (req, res, next) => {
  //1. get user from db
  const currentPassword = req.body.currentPassword;
  const id = req.user.id;
  let user = await User.findById(id).select("+password");

  //2. check if given password is correct
  console.log(currentPassword);
  if (!(await user.checkPassword(currentPassword, user.password)))
    return next(new AppError("incorrect password", 401));

  //3. update the db with new password
  user.password = req.body.newPassword;
  user.confirmPassword = req.body.confirmPassword;
  user = await user.save();

  //4. login the user
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.EXPIRES_IN
  });
  res.cookie("jwt", token, {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: process.env.COOKIE_SECURE === "true",
    httpOnly: true
  });

  res.status(201).json({
    status: "succes",
    token,
    data: user
  });
});
