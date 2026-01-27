import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * GET /dashboard/stats
 * Channel dashboard statistics
 */
const getChannelStats = asyncHandler(async (req, res) => {
    const channelId = req.user._id;

    const videoIds = await Video.find({ owner: channelId })
        .select("_id")
        .lean();

    const videoObjectIds = videoIds.map(v => v._id);

    const [
        totalVideos,
        totalViews,
        totalLikes,
        totalComments,
        totalSubscribers
    ] = await Promise.all([
        Video.countDocuments({ owner: channelId }),

        Video.aggregate([
            { $match: { owner: new mongoose.Types.ObjectId(channelId) } },
            { $group: { _id: null, views: { $sum: "$views" } } }
        ]),

        Like.countDocuments({
            video: { $in: videoObjectIds }
        }),

        Comment.countDocuments({
            video: { $in: videoObjectIds }
        }),

        Subscription.countDocuments({
            Channel: channelId
        })
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalVideos,
                totalViews: totalViews[0]?.views || 0,
                totalLikes,
                totalComments,
                subscribers: totalSubscribers
            },
            "Channel stats fetched successfully"
        )
    );
});

/**
 * GET /dashboard/videos
 * All videos uploaded by the channel
 */
const getChannelVideos = asyncHandler(async (req, res) => {
    const channelId = req.user._id;

    const videos = await Video.find({ owner: channelId })
        .sort({ createdAt: -1 })
        .select(
            "title thumbnail videoFile duration isPublished createdAt"
        );

    return res.status(200).json(
        new ApiResponse(
            200,
            videos,
            "Channel videos fetched successfully"
        )
    );
});

export {
    getChannelStats,
    getChannelVideos
};
