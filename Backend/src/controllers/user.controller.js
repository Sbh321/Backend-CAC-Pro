import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary";

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

  // Check if the fields are empty
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // check is the username or email already exists and return true or false
  const exitedUser = User.findOne({ $or: [{ username }, { email }] });

  if (exitedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

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

export { registerUser };
