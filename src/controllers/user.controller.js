import { ApiError } from "../utils/ApiError.js"; 
import { User } from "../models/user.model.js";
import { uploadToImageKit } from "../utils/imagekit.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler  from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { threadName } from "worker_threads";


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
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Old password is incorrect");
  }
  user.password = newPassword;
  await user.save();
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
}
)
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
})
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName && !email) {
    throw new ApiError(400, "At least one field is required");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName,
        email
      }
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
})
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }
  const avatar = await uploadToImageKit(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Failed to upload avatar image");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { avatar: avatar.url } },
    { new: true })
    .select("-password");
    return res
    .status(200)
    .json(new ApiResponse(200, user, "User avatar updated successfully"));
  })
  const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image is required");
  }
  const coverImage = await uploadToImageKit(coverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(400, "Failed to upload cover image");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { coverImage: coverImage.url } },
    { new: true })
    .select("-password");
    return res
    .status(200)
    .json(new ApiResponse(200, user, "User cover image updated successfully"));
  })
  const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Username is required");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers"
        },
        channelSubscribedToCount: {
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        channelSubscribedToCount: 1,
        isSubscribed: 1
      }
    }
  ]);
  if(!channel?.length) {
    throw new ApiError(404, "Channel not found");
  }

  return res.status(200).json(
    new ApiResponse(200, channel[0], "Channel profile fetched successfully")
  );
});
const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first: "$owner"
              }
            }
          }
        ]
      }
    }
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      user[0]?.watchHistory || [],
      "Watch history fetched successfully"
    )
  );
});



export {
   registerUser, 
   loginUser,
   logoutUser,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentUser,
   updateAccountDetails,
   updateUserAvatar,
   updateCoverImage,
   getUserChannelProfile,
   getWatchHistory
}
