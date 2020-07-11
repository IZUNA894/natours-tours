const express = require("express");
const authController = require("./../controllers/authController");
const userController = require("./../controllers/userController");

var router = express.Router();

//signUp
router.post("/create/user", authController.createUser);

//login a user
router.post("/login/user", authController.loginUser);

//logout
router.get("/user/logout", authController.logout);

//forgot password
router.post("/user/forgotPassword", authController.forgotPassword);

//reset password
router.post("/user/resetPassword/:token", authController.resetPassword);

//update password
router.patch(
  "/user/updatePassword",
  authController.checkAuth,
  authController.updatePassword
);

//update user info
router.patch(
  "/user/updateMe",
  authController.checkAuth,
  userController.uploadPic,
  userController.resizeUserPhoto,
  userController.updateMe
);

//deleting user
router.delete(
  "/user/deleteMe",
  authController.checkAuth,
  userController.deleteMe
);

//getting all users
router.get("/user/getAllUsers", userController.getAllUsers);

//getting  me
router.get("/user/getMe", authController.checkAuth, userController.getMe);

module.exports = router;
