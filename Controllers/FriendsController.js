const User = require("../Models/Users");
const { getReceiverId, io } = require("../Utils/Socket");



const getFriends = async (req, res) => {
    const id = req.user.id

    try {

        const user = await User.findById(id)
            .populate('friends')                  // Populate the 'friends' array with user details
            .populate('friendRequests')           // Populate the 'friendRequests' array with user details
            .populate('sentFriendRequests')       // Populate the 'sentFriendRequests' array with user details
            .select('friends sentFriendRequests friendRequests'); // Select only the relevant fields

            if (!user) {
                return res.status(500).json({
                    message: "You are not found in DB",
                })
            }
        return res.status(200).json( {
            message: 'User data retrieved successfully',
            friends: user.friends,
            friendRequests: user.friendRequests,
            sentFriendRequests: user.sentFriendRequests,
        });

    } catch (error) {
        return res.status(500).json({
            message: "Some Error Occured",
            error: error
        })
    }
}




const sendRequest = async (req, res) => {
    const id = req.user.id

    const { userId } = req.params

    try {
        const me = await User.findById(id)
        const user = await User.findById(userId)

        if (!me || !user) {
            return res.status(500).json({
                message: "User Not Found"
            })
        }

        let senderList = me.sentFriendRequests || []
        let MyRequests =  me.friendRequests || []
        let receiverList = user.friendRequests || []

        const friends = me.friends || []
        const isFriend = friends.filter(itm=>itm.toString() === user._id.toString())
        const AlreadySent = senderList.filter(itm=>itm.toString() === user._id.toString())
        const AlreadyReceived = MyRequests.filter(itm=>itm.toString() === user._id.toString())

        if(isFriend?.length>0 ||AlreadySent?.length>0 || AlreadyReceived?.length>0 ){
            return res.status(500).json({
                message:"Already Friends or Request is sent or Received Already"
            })
        }

        senderList.unshift(userId)
        receiverList.unshift(id)

        const sent = await User.findByIdAndUpdate(id, {
            $set: {
                sentFriendRequests: senderList
            }
        })
        const received = await User.findByIdAndUpdate(userId, {
            $set: {
                friendRequests: receiverList
            }
        })

        const receiverSocketId = getReceiverId(userId)
        if(receiverSocketId){
            io.to(receiverSocketId).emit("requestReceived",{
                username:user?.name
            } )
        }

        return res.status(200).json({
            message: "Request Sent"
        })
    } catch (error) {
        return res.status(500).json({
            message: "Some Error Occured",
            error: error
        })
    }
}

const cancelRequest = async (req,res)=>{

    const { sender , receiver } = req.body

    try {
        const senderUser = await User.findById(sender)
        const receiverUser = await User.findById(receiver)

        if (!senderUser || !receiverUser) {
            return res.status(500).json({
                message: "User Not Found"
            })
        }

       

        let senderList = senderUser.sentFriendRequests || []
        let receiverList = receiverUser.friendRequests || []


        senderList = senderList.filter(itm => itm.toString() !== receiverUser._id.toString());
        receiverList = receiverList.filter(itm => itm.toString() !== senderUser._id.toString());

        const sent = await User.findByIdAndUpdate(sender, {
            $set: {
                sentFriendRequests: senderList
            }
        })
        const received = await User.findByIdAndUpdate(receiver, {
            $set: {
                friendRequests: receiverList
            }
        })

        return res.status(200).json({
            message: "Request Canceled"
        })
    } catch (error) {
        return res.status(500).json({
            message: "Some Error Occured",
            error: error
        })
    }
}
const acceptRequest = async (req,res)=>{

    const { sender , receiver } = req.body

   
    try {
        const senderUser = await User.findById(sender)
        const receiverUser = await User.findById(receiver)

        if (!senderUser || !receiverUser) {
            return res.status(500).json({
                message: "User Not Found"
            })
        }

       

        let senderList = senderUser.sentFriendRequests || []
        let receiverList = receiverUser.friendRequests || []

        let senderFriend = senderUser.friends || []
        let receiverFriend = receiverUser.friends || []

        receiverFriend.push(sender);
        senderFriend.push(receiver);


        senderList = senderList.filter(itm => itm.toString() !== receiverUser._id.toString());
        receiverList = receiverList.filter(itm => itm.toString() !== senderUser._id.toString());

        const sent = await User.findByIdAndUpdate(sender, {
            $set: {
                sentFriendRequests: senderList,
                friends:senderFriend
            }
        })
        const received = await User.findByIdAndUpdate(receiver, {
            $set: {
                friendRequests: receiverList,
                friends:receiverFriend
            }
        })

        return res.status(200).json({
            message: "Request Accepted"
        })
    } catch (error) {
        return res.status(500).json({
            message: "Some Error Occured",
            error: error
        })
    }
}

const unfriend = async (req,res)=>
{
    const sender = req.user.id
    const {receiver } = req.params

    try {
        const senderUser = await User.findById(sender)
        const receiverUser = await User.findById(receiver)

        if (!senderUser || !receiverUser) {
            return res.status(500).json({
                message: "User Not Found"
            })
        }

        let senderList = senderUser.friends || []
        let receiverList = receiverUser.friends || []

        senderList = senderList.filter(itm => itm.toString() !== receiverUser._id.toString());
        receiverList = receiverList.filter(itm => itm.toString() !== senderUser._id.toString());

        const sent = await User.findByIdAndUpdate(sender, {
            $set: {
                friends: senderList
            }
        })
        const received = await User.findByIdAndUpdate(receiver, {
            $set: {
                friends: receiverList
            }
        })

        return res.status(200).json({
            message: "unfriend Succesfull"
        })
    } catch (error) {
        return res.status(500).json({
            message: "Some Error Occured",
            error: error
        })
    }
}



module.exports = {
    sendRequest,
    getFriends,
    cancelRequest,
    unfriend,
    acceptRequest,
}