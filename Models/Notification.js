const mongoose = require('mongoose');

const notifications = mongoose.Schema({
    User:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    By:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },

    Title:{
        type:String,
        required:true
    },
    Description:{
        type:String,
        required:true
    },
    Link:{
        type:String,
        required:true
    },
    IsRead:{
        type:Boolean,
        default:false
    }
},{
    timestamps:true
})

const Notification = mongoose.model("Notification",notifications)

module.exports = Notification