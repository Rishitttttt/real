import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Toggle like on VIDEO
 * POST /likes/toggle/v/:videoId
 */
const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: userId
    });

    let isLiked;

    if (existingLike) {
        await existingLike.deleteOne();
        isLiked = false;
    } else {
        await Like.create({
            video: videoId,
            likedBy: userId
        });
        isLiked = true;
    }

    const totalLikes = await Like.countDocuments({ video: videoId });

    return res.status(200).json(
        new ApiResponse(
            200,
            { isLiked, totalLikes },
            "Video like toggled successfully"
        )
    );
});

/**
 * Toggle like on COMMENT
 * POST /likes/toggle/c/:commentId
 */
const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: userId
    });

    let isLiked;

    if (existingLike) {
        await existingLike.deleteOne();
        isLiked = false;
    } else {
        await Like.create({
            comment: commentId,
            likedBy: userId
        });
        isLiked = true;
    }

    const totalLikes = await Like.countDocuments({ comment: commentId });

    return res.status(200).json(
        new ApiResponse(
            200,
            { isLiked, totalLikes },
            "Comment like toggled successfully"
        )
    );
});

/**
 * Toggle like on TWEET
 * POST /likes/toggle/t/:tweetId
 */
const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: userId
    });

    let isLiked;

    if (existingLike) {
        await existingLike.deleteOne();
        isLiked = false;
    } else {
        await Like.create({
            tweet: tweetId,
            likedBy: userId
        });
        isLiked = true;
    }

    const totalLikes = await Like.countDocuments({ tweet: tweetId });

    return res.status(200).json(
        new ApiResponse(
            200,
            { isLiked, totalLikes },
            "Tweet like toggled successfully"
        )
    );
});

/**
 * Get all liked videos by logged-in user
 * GET /likes/videos
 */
const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const likes = await Like.find({
        likedBy: userId,
        video: { $ne: null }
    })
        .populate({
            path: "video",
            select: "title thumbnail duration owner createdAt"
        })
        .sort({ createdAt: -1 });

    const likedVideos = likes
        .map(like => like.video)
        .filter(Boolean);

    return res.status(200).json(
        new ApiResponse(
            200,
            likedVideos,
            "Liked videos fetched successfully"
        )
    );
});

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
};
