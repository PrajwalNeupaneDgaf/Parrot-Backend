const mongoose = require('mongoose');

const messages = mongoose.Schema({
    Sender:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    Receiver:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    Message:{
        type:String,
        required:true
    },
    DeletedFor:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    }],
    IsShared:{
        type:Boolean,
        default:false
    }
},{
    timestamps:true
})

const Message = mongoose.model("Message",messages)

module.exports = Message