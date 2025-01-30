const User = require("../Models/Users");

const profileData = async (req, res) => {
    try {
        const userId = req.params.userId; // Extract userId correctly
        const user = await User.findById(userId).populate({
            path:'posts',
            populate:{ path: "PostedBy", select: "_id name profile" }
            
        }).populate({
            path:'friends',
            options: { limit: 9 },
            select:'name _id profile'
        }).populate({
            path:'groups',
            options: { limit: 9 },
            select:'Name _id Profile'
        });
        const ownUser = await User.findById(req.user.id);

        if (!user || !ownUser) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        if (userId === req.user.id) {
            return res.status(200).json({
                User: user,
                isOwnId: true,
                isFriend: false,
                isRequested: false,
            });
        }

        const friends = ownUser.friends || [];
        const requests = ownUser.sentFriendRequests || [];

        
        const isFriend = friends.includes(userId)
        const isRequested = requests.includes(userId)

        return res.status(200).json({
            User: user,
            isOwnId: false,
            isFriend: isFriend,
            isRequested: isRequested,
        });
    } catch (error) {
        console.error("Error fetching profile data:", error);
        return res.status(500).json({
            message: "An error occurred while fetching profile data",
        });
    }
};

module.exports = { profileData };
