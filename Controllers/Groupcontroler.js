const Group = require("../Models/Group");
const Notification = require("../Models/Notification");
const User = require("../Models/Users");
const cloudinary = require('../Utils/Cloudinary')

const CreateGroup = async (req, res) => {
    const userId = req.user.id;
    const { Name, GroupStatus } = req.body;
    let Profile = req.files?.Profile;

    try {
        if (!Name || !GroupStatus) throw new Error(`Missing required fields`);

        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        const groups = await Group.find({ CreatedBy: userId });
        const maxGroupsAllowed = 2; // Configurable
        if (groups.length >= maxGroupsAllowed)
            throw new Error(`Maximum ${maxGroupsAllowed} groups allowed`);

        let profileImage =
            "https://img.freepik.com/premium-photo/group-different-parrot-species-white-background_984027-120739.jpg";
        if (Profile) {
            const result = await cloudinary.uploader.upload(Profile.tempFilePath, {
                folder: "profiles",
            });
            profileImage = result.secure_url;
        }

        const newGroup = new Group({
            Name,
            Profile: profileImage,
            GroupStatus,
            CreatedBy: userId,
            Members: [userId],
        });

        await newGroup.save();

        user.groups.push(newGroup._id);
        await user.save();

        return res.status(200).json({
            message: "Group created successfully",
            group: newGroup,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

const updateGroup = async (req, res) => {
    const userId = req.user.id;
    const { Name, GroupStatus } = req.body;
    const { groupId } = req.params;
    let Profile = req.files?.Profile;

    try {
        if (!Name && !GroupStatus && !Profile)
            throw new Error(`No data provided for update`);

        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        const group = await Group.findById(groupId);
        if (!group) throw new Error("Group not found");

        if (group.CreatedBy.toString() !== user._id.toString()) throw new Error("You are Not allowed");

        let profileImage = group.Profile;
        if (Profile) {
            const result = await cloudinary.uploader.upload(Profile.tempFilePath, {
                folder: "profiles",
            });

            // Delete the old image if not using the default
            if (
                group.Profile !==
                "https://img.freepik.com/premium-photo/group-different-parrot-species-white-background_984027-120739.jpg"
            ) {
                const publicId = group.Profile.split("/").slice(-2).join("/").split(".")[0];
                await cloudinary.uploader.destroy(publicId);
            }

            profileImage = result.secure_url;
        }

        group.Name = Name || group.Name;
        group.Profile = profileImage;
        group.GroupStatus = GroupStatus || group.GroupStatus;

        await group.save();

        return res.status(200).json({
            message: "Group updated successfully",
            group,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

const JoinGroup = async (req, res) => {
    const userId = req.user.id;
    const { groupId } = req.params;

    try {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        const group = await Group.findById(groupId);
        if (!group) throw new Error("Group not found");

        const Member = group.Members.filter(itm => itm.toString() === userId)

        const isMember = Member.length > 0 ? true : false
        if (isMember) throw new Error('Already Joined')
        if (group.GroupStatus === "Private") {
            // Ensure requests array exists
            const Requests = group.Requests.filter(itm => itm._id.toString() === userId)

            if (Requests.length !== 0) throw new Error('Already Requested')
            
                const groupOwner = await User.findById(group.CreatedBy)

                const notification = new Notification({
                    User:groupOwner._id,
                    By:userId,
                    Title:'Requested To Join Group',
                    Description:`${user.name} Requested to join Your Group.`,
                    Link:`/group/visit/${group._id}`
                })
                groupOwner.notifications.push(notification._id)
                group.Requests.push(userId);
                await group.save();
                await notification.save()
                await groupOwner.save()
         

            return res.status(200).json({
                message: "Request to join group sent successfully",
                isJoined:false
            });
        } else {

            user.groups.push(groupId);
            group.Members.push(userId);

            await user.save();
            await group.save();

            return res.status(200).json({
                message: "Joined group successfully",
                isJoined:true
            });
        }
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

const handleRequests = async (req, res) => {
    const userId = req.user.id
    const { groupId } = req.params
    const { requestId, status } = req.body //status true if accepted or Rejected

    try {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        const requestedUser = await User.findById(requestId);
        if (!requestedUser) throw new Error("Requested User not found");

        const group = await Group.findById(groupId);
        if (!group) throw new Error("Group not found");

        if (group.CreatedBy.toString() !== user._id.toString()) throw new Error("You are Not Allowed");

        const Member = group.Members.filter(itm => itm.toString() === requestId)

        const isMember = Member.length > 0 ? true : false

        if (isMember) throw new Error("You are already a member");

        const reqs = group.Requests.filter(itm => itm.toString() === requestId)

        const isRequested = reqs.length > 0 ? true : false

        if (!isRequested) throw new Error("User didn't requested to Join");

        if (status) {
            group.Requests = group?.Requests?.filter(itm => itm.toString() !== requestedUser._id.toString())
            group.Members.push(requestId)
            await group.save()
            return res.status(200).json({
                message: 'Accepted'
            })
        } else {
            group.Requests = group?.Requests?.filter(itm => itm.toString() !== requestedUser._id.toString())
            await group.save()
            return res.status(200).json({
                message: 'Deleted'
            })
        }
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
}

const removeUser = async (req, res) => {
    const userId = req.user.id
    const { groupId, requestId } = req.params

    try {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        if (requestId === userId) throw new Error("Can't Kick Own Ass");

        const requestedUser = await User.findById(requestId);
        if (!requestedUser) throw new Error("Requested User not found");

        const group = await Group.findById(groupId);
        if (!group) throw new Error("Group not found");

        if (group.CreatedBy.toString() !== user._id.toString()) throw new Error("You are Not Allowed");


        group.Members = group?.Members?.filter(itm => itm.toString() !== requestedUser._id.toString())

        requestedUser.groups = requestedUser?.groups?.filter(itm=>itm.toString() !== groupId)

        await group.save()
        await user.save()
        return res.status(200).json({
            message: 'Kicked'
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
}

const getGroupData = async (req, res) => {
    const userId = req.user.id
    const { groupId } = req.params

    try {
        const user = await User.findById(userId)
        if (!user) throw new Error("User not Found")
        const group = await Group.findById(groupId).populate({
            path: "Posts",
            populate: {
                path: 'PostedBy',
                select: "_id name profile"
            },
            select: '-PostedAt'
        }).populate({
            path: "Members",
            select: "_id name profile"
        }).populate({
            path: "Requests",
            select: "_id name profile"
        })

        const groupForOther =  await Group.findById(groupId).select('-Posts -Requests')

        if (!group) throw new Error("Group not Found")

        const isPrivate = group?.GroupStatus == "Private" ? true : false

        const Member = group.Members.filter(itm => itm._id.toString() === userId)

        const isMember = Member.length > 0 ? true : false

        const isRequested = group.Requests.filter(itm=>itm._id.toString()===userId)

        return res.status(200).json({
            data: isPrivate && !isMember ? groupForOther: group,
            isMember: isMember,
            isPrivate: isPrivate,
            isRequested:isRequested.length>0?true:false
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
}

const getDataForUpdate = async (req, res) => {
    const userId = req.user.id
    const { groupId } = req.params

    try {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        if (!groupId) throw new Error("Group ID is required");

        const group = await Group.findById(groupId);
        if (!group) throw new Error("Group not found");

        if (group.CreatedBy.toString() !== user._id.toString()) throw new Error("You are Not Allowed");


        return res.status(200).json({
            message: 'succesfull',
            data: group
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
}

const getUserGroups = async (req, res) => {
    const userId = req.user.id
    try {
        const user = await User.findById(userId).populate({
            path: 'groups',
            select: "_id Name Profile Members CreatedBy",
            populate: {
                path: 'CreatedBy',
                select: '_id name profile'
            }
        }).select('groups')
        if (!user) throw new Error("User not found");

        return res.status(200).json({
            message: 'succesfull',
            data: user
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
}

const LeaveGroup = async (req, res) => {
    const userId = req.user.id
    const { groupId } = req.params

    try {
        const user = await User.findById(userId)
        if (!user) throw new Error('User Not Found')
        const group = await Group.findById(groupId)
        if (!group) throw new Error('Group Not Found')

        const Member = group.Members.filter(itm => itm.toString() === userId)

        const isMember = Member.length > 0 ? true : false

        if (!isMember) throw new Error('Member Not Found')

        group.Members = group?.Members?.filter(itm => itm.toString() !== userId)

        user.groups = user?.groups?.filter(itm=>itm.toString() !== groupId)
        await group.save()
        await user.save()

        return res.status(200).json({
            message:'You Left The Group'
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
        
    }
}

const cancelRequest = async (req,res)=>{
    const userId = req.user.id
    const { groupId } = req.params

    try {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        const group = await Group.findById(groupId);
        if (!group) throw new Error("Group not found");

        const Member = group.Members.filter(itm => itm.toString() === userId)

        const isMember = Member.length > 0 ? true : false

        if (isMember) throw new Error("You are already a member");

        const reqs = group.Requests.filter(itm => itm.toString() === requestId)

        const isRequested = reqs.length > 0 ? true : false

        if (!isRequested) throw new Error("User didn't requested to Join");

        group.Requests = group?.Requests?.filter(itm => itm.toString() !== userId)

        await group.save()
        return res.status(200).json({
            message: 'Deleted'
        })
        
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
}

module.exports = {
    CreateGroup,
    updateGroup,
    JoinGroup,
    handleRequests,
    removeUser,
    getGroupData,
    getDataForUpdate,
    getUserGroups,
    LeaveGroup,
    cancelRequest
};


//make the get group data and get group data for updating and all 
