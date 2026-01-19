import asyncHandler from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"; 
import User from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, fullName } = req.body;
  if (
    [username, email, password, fullName].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const existingUser = await User.find({
    $or: [{ email }, { username }],
  })
  if(existingUser){
    throw new ApiError(409, "User already exists");
  }
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar image is required");
  }
  const avatar = await uploadToCloudinary(avatarLocalPath)
  const coverImage =  await uploadToCloudinary(coverImageLocalPath)
  if(!avatar){
    throw new ApiError(400, "Failed to upload avatar image");
  }
  const user = await User.create({
    FullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
    })
    const createdUser = await user.findById(user._id).select("-password -refreshToken");
    if(!reatedUser){
      throw new ApiError(500, "Failed to create user");
    }
    return res.status(201).json(new ApiResponse(200, createdUser, "User registered successfully"));

})

export {
   registerUser, 
  }
