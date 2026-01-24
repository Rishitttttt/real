import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken
} from "../controllers/user.controller.js";

import  { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.post(
  "/register",
  (req, res, next) => {
    upload.fields([
      { name: "avatar", maxCount: 1 },
      { name: "coverImage", maxCount: 1 }
    ])(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  },
  registerUser
);

router.post("/login", loginUser);

router.post("/logout", verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);

export default router;
