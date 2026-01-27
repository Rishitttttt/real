const healthcheck = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                status: "OK",
                uptime: process.uptime(),
                timestamp: new Date().toISOString()
            },
            "Server is healthy"
        )
    );
});

export {
    healthcheck
};
