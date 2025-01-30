const Notification = require("../Models/Notification")

const getMyNotification = async (req,res)=>
{
    const id = req.user.id

    try {
        const notifications = await Notification.find({User:id}).populate({
            path:"By",
            select:"_id name profile"
        })

        return res.status(200).json({
            notifications:notifications
        })
    } catch (error) {
        return res.status(500).json({
            message:error.message ||"Some error Occured",
            error:error
        })
    }   
}

const markAllAsRead = async(req,res)=>{
    const id = req.user.id

    try {
        const unreadNotifications = await Notification.updateMany(
            {
              User: id,
              IsRead: false, // Filter for unread notifications
            },
            {
              $set: {
                IsRead: true, // Update to mark them as read
              },
            }
          );

          return res.status(200).json({
            message:"Succesfull"
          })
    } catch (error) {
        return res.status(500).json({
            message:error.message ||"Some error Occured",
            error:error
        })
    }
}


module.exports = 
{
    getMyNotification,
    markAllAsRead
}