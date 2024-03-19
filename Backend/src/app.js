import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

//This middleware allows requests from origin defined in .env file for now its *(allow all)
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

//This middleware configures express to parse the incoming requests with JSON payloads and sets a limit for the JSON data
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//Routes import

import userRouter from "./routes/user.routes.js";

//route declaration

app.use("/api/v1/users", userRouter);

export { app };
