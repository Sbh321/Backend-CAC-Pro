//require("dotenv").config();
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({ path: "./env" });

//We used async method for database connecion code, an async method acts same as an promise where we have either response or reject so to handel them.
connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log("Express id serving at: ", process.env.PORT);
    });
  })
  .catch((error) => {
    console.log("MONGO conn fail ", error);
  });

//Another approach by creating an iife to connect database
/*
import express from "express";
const app = express();

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODBB_URL}/${DB_NAME}`);
    app.on("error", () => {
      console.log("ERROR", error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log("App is listening on port: ", process.env.PORT);
    });
  } catch (error) {
    console.log("ERROR", error);
    throw error;
  }
})();
*/
