const Posts = require("../Models/Posts"); // Post model
const User = require("../Models/Users");

const getHomePagePost = async (req, res) => {
    try {
        const userId = req.user.id;
        if (!userId) throw new Error("Unauthorized");

        // Fetch the user's friends and groups
        const user = await User.findById(userId).select("friends groups");
        if (!user) throw new Error("User not found");

        const { friends, groups } = user;

        // Fetch posts from friends and groups
        const posts = await Posts.find({
            $or: [
                { PostedBy: { $in: friends } },  // Posts by friends
                { PostedAt: { $in: groups } },   // Posts in user's groups
            ],
        }).populate({
            path:'PostedBy',
            select:'_id name profile'
        }).populate({
            path:'PostedAt',
            select:'_id Name Profile'
        })

        if (!posts || posts.length === 0) {
            return res.status(200).json({
                message: "No posts available",
                posts: [],
            });
        }

        // Shuffle and pick 15 random posts
        const randomPosts = posts
            .sort(() => 0.5 - Math.random())
            .slice(0, 30);

        return res.status(200).json({
            message: "Posts fetched successfully",
            posts: randomPosts,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || "Server Error",
        });
    }
};


module.exports = {
    getHomePagePost
}