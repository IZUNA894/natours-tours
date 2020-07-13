const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

var userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "please give us your name"]
  },
  email: {
    type: String,
    required: true,
    unique: [true, "give us your email"],
    lowercase: true,
    validate: {
      validator: function(val) {
        return validator.isEmail(val);
      },
      message: `${JSON.stringify(this)} is not email`
    }
  },
  password: {
    type: String,
    required: [true, "please give us your password"]
  },
  confirmPassword: {
    type: String,
    required: [true, "please confirm your password"],
    validate: {
      //run only when on save
      validator: function(val) {
        return val === this.password;
      },
      message: "password should be equal to confirm password"
    }
  },
  photo: {
    type: String,
    default: "default.jpg"
  },
  passwordChangedAt: Date,
  role: {
    type: String,
    default: "user",
    enum: ["admin", "user", "guide", "lead-guide"]
  },
  passwordResetToken: String,
  passwordResetExpires: String,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

//for hashing the password
userSchema.pre("save", async function(next) {
  //only run this when passwors is updated or save

  if (!this.isModified("password")) return next();

  //getting hash
  this.password = await bcrypt.hash(this.password, 10);

  //clearing the confirmPassword as we dont need
  this.confirmPassword = undefined;
  next();
});

//for reseting the passwordChangedAt ,when user has changed the password
userSchema.pre("save", async function(next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now();
});

//for checking the hashed pasword at time of login
userSchema.methods.checkPassword = async function(candidatePass, userPass) {
  return await bcrypt.compare(candidatePass, userPass);
};

// for checking if user has changed the password after JWT has issued
userSchema.methods.changedPasswordAfter = async function(iat) {
  if (this.passwordChangedAt) {
    const changeTimeStamp = parseInt(this.passwordChangedAt / 1000, 10);
    return iat < changeTimeStamp;
  }
  //return false if user hasnt changed password after jwt issued
  return false;
};

//creating password reset token
userSchema.methods.createResetToken = async function() {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

//selecting only those doc which have active :true
userSchema.pre(/^find/, async function(next) {
  this.find({ active: { $ne: false } });
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
