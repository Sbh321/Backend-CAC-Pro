import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    //here user becomes an instance of the record we are searching through User schema
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    //adding refreshtoken to the DataBase record
    user.refreshToken = refreshToken;
    //saving the updated refreshToken in the object record and stoping the validation before save
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      505,
      "Something went wrong while generating Access and Refresh Token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //-------------------------Algo-----------------------------------
  //-----------------------------------------------------------------
  // get user details from front end (we use postman for it as we dont have a front end for now)
  // Validation of data sent by the user (not empty)
  // check if user already exists(check email and username)
  // check for images, check for avatar
  // upload them to cloudinary, check avater is uploaded or not
  // create a user object(as we sent data in object in mongoDB) - create entry in db
  // remove passowrd and refresh token field from response
  // check for user creation
  // return response(res)
  //-------------------------------------------------------------------

  // getting data from fronted ie postman for now
  const { fullName, email, username, password } = req.body;
  // const resObj = req.body;
  console.log(`username: ${username} email: ${email} password: ${password}`);

  console.log(req.files);

  // Check if the fields are empty
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // check is the username or email already exists and return true or false
  const exitedUser = await User.findOne({ $or: [{ username }, { email }] });

  if (exitedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  //To check if our user was created in mongoDB or not we need check if user has _id or not _id is a value mongoDB adds every time we create an entry and removing password and refreshToken from it
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering a user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //-------------------------Algo-----------------------------------
  //-----------------------------------------------------------------
  //get data from front end/ postman
  //req.body -> data (get the data from request body)
  //decide username or email based session management
  //find the user(username or eail)
  //check the password
  //generte access and refresh token
  //send cookie

  const { email, username, password } = req.body;
  console.log(email);

  if (!username && !email) {
    throw new ApiError(400, "Username or Password is required!!");
  }

  //Searching for given username or password in the mongoDB
  const user = await User.findOne({
    //$or is an operator in mongoDB we use an array with objects to check for multiple value based on the operator
    $or: [{ username }, { email }],
  });

  //If given username or password did not match to any record in DB then throw an error
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  //Validaing the password using isPasswordValid method and returns a boolean
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  //calling generateAccessAndRefreshTokens function and passing user._id in it
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  ); //it might take some time to to run the function so we are using async in it

  //again searching for the same record as we updated the record with new refreahToken above or we can just update the user instance of abve
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //--doing this the cookies will not be modifiable from frontend
  const options = {
    httpOnly: true,
    secure: true,
  };

  //returning/sending cooking as response
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in sucessfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  //-------------------------Algo-----------------------------------
  //-----------------------------------------------------------------
  // set refreshToken from DB to undefined
  // return response by clearing the access and refresh token in cookies

  await User.findByIdAndUpdate(
    req.user._id,
    {
      //set operator is used to update feilds
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invaid refresh token");
  }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
