import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("bearer", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized token");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-passord -refreshToken"
    );

    if (!user) {
      // TODO: discuss about frontend
      throw new ApiError(401, "Invalid access token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
    //here if the error is null or undefined then it doesnt try to access message property and the value of the first half of the expression is set to undefined in ||(Or operation) as first half is undefined which is a falsy value the second half is selected. If no optional chaining was to be appliled in case of error being undefined or null trying to access it property which doesnt exist would give an error.
  }
});
