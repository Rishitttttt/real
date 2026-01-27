import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * POST /subscriptions/c/:channelId
 * Toggle subscription to a channel
 */
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const subscriberId = req.user._id;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    // ❌ prevent self-subscription
    if (channelId.toString() === subscriberId.toString()) {
        throw new ApiError(400, "You cannot subscribe to yourself");
    }

    // ensure channel exists
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: subscriberId,
        Channel: channelId, // ⚠️ capital C (your schema)
    });

    let isSubscribed;

    if (existingSubscription) {
        await existingSubscription.deleteOne();
        isSubscribed = false;
    } else {
        await Subscription.create({
            subscriber: subscriberId,
            Channel: channelId,
        });
        isSubscribed = true;
    }

    const subscribersCount = await Subscription.countDocuments({
        Channel: channelId,
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            { isSubscribed, subscribersCount },
            "Subscription toggled successfully"
        )
    );
});

/**
 * GET /subscriptions/u/:subscriberId
 * Get subscribers of a channel
 */
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const subscribers = await Subscription.find({
        Channel: subscriberId,
    })
        .populate("subscriber", "username fullName avatar")
        .sort({ createdAt: -1 });

    const users = subscribers.map(sub => sub.subscriber);

    return res.status(200).json(
        new ApiResponse(
            200,
            users,
            "Channel subscribers fetched successfully"
        )
    );
});

/**
 * GET /subscriptions/c/:channelId
 * Get channels a user has subscribed to
 */
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const subscriptions = await Subscription.find({
        subscriber: channelId,
    })
        .populate("Channel", "username fullName avatar")
        .sort({ createdAt: -1 });

    const channels = subscriptions.map(sub => sub.Channel);

    return res.status(200).json(
        new ApiResponse(
            200,
            channels,
            "Subscribed channels fetched successfully"
        )
    );
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
};
