//require("dotenv").config();
import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({ path: "./env" });

connectDB();

//Another approach by creating an ifie to connect database
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
