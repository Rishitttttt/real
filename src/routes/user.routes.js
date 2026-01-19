import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/upload.middleware.js"; 

const router = Router();

router.post("/register", registerUser).post(
    UploadStream.fields([
        {
            name: "avatar",
            maxcount: 1
        },
        {
            name: "coverImage",
            maxcount: 1
        }
    ]
    )
)

export default router;
