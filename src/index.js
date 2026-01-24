import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
console.log("ENV CHECK:", {
  IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY,
  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY ? "LOADED" : undefined,
  IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT,
});

import connectDB from "./db/index.js";
import app from "./app.js";



connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start the server:", error);
    process.exit(1);
  });

