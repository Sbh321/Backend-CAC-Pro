import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    avatar: {
      type: String,
      required: true,
    },

    coverImage: {
      type: String,
    },

    watchHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],

    password: {
      type: String,
      required: [true, "Password is required"], //Adding a custom error
    },

    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

//pre is a middleware or hook
//Before data is saved we run the following operation to hash password
//Here we cannot use an arrow function cause we cant use this keyword in arrow funciton to know the current context
//Next to pass the flag
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); //if password is not modified then below code to hass password is not executed

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  await bcrypt.compare(password, this.password);
};

//generateAccessToken is a function expression which is set as a property of the methods object of userSchema
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    //jwt.sign() is used to create a JSON wen tokens based on provided payload and options (payload is just a data)
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

export const User = mongoose.model("User", userSchema); //saves as users in mongoDB
