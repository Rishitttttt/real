import { ApiError } from "../utils/ApiError.js"; 
import { User } from "../models/user.model.js";
import { uploadToImageKit } from "../utils/imagekit.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler  from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";


const generateAccessandRefreshTokens = async (userId) => {
  try{
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })
      return { accessToken, refreshToken }
  } catch (error) {
    throw new ApiError(500, "Failed to generate tokens");
  }
}

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, fullName } = req.body;

  if ([username, email, password, fullName].some(field => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }

  const avatar = await uploadToImageKit(avatarLocalPath);
  const coverImage = await uploadToImageKit(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Failed to upload avatar image");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id)
    .select("-password -refreshToken");

  if (!createdUser) {
    throw new ApiError(500, "Failed to create user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});
const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  // 1. Validate input
  if (!email && !username) {
    throw new ApiError(400, "Username or email are required");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  // 2. Build query safely (BEST way)
  const query = [];

  if (email) {
    query.push({ email });
  }

  if (username) {
    query.push({ username: username.toLowerCase() });
  }

  const user = await User.findOne({ $or: query });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // 3. Check password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Password is incorrect");
  }

  // 4. Generate tokens
  const { accessToken, refreshToken } =
    await generateAccessandRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id)
    .select("-password -refreshToken");

  // 5. Send cookies + response
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {$set: {refreshToken: null}},
     {new: true});
     const options = {
      httpOnly: true,
      secure: true, 
     }
     return res.status(200)
     .clearCookie("accessToken", options)
     .clearCookie("refreshToken", options) 
     .json(new ApiResponse(200, null, "User logged out successfully"));
  })
  const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized: No refresh token provided");
    }
    try{const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id)
    if(!user) {
      throw new ApiError(401, "Unauthorized: Invalid refresh token");
    }
    if(incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Unauthorized: Refresh token mismatch");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newrefreshToken } = await generateAccessandRefreshTokens(user._id);
    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newrefreshToken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken: newrefreshToken},
        "Refresh token generated successfully"
      )
    );
  }catch (error) {
    throw new ApiError(401, "Unauthorized: Invalid refresh token");
  }
});

export {
   registerUser, 
   loginUser,
   logoutUser,
   refreshAccessToken,
}
