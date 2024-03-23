import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//secured routes and running middleware in routes
router.route("/logout").post(verifyJWT, logoutUser);
//remember we wrote next(); at last in the defination of verifyJWT middleware when execution reaches that point then it goes to logoutUser due to it.

router.route("/refresh-token").post(refreshAccessToken);

export default router;
