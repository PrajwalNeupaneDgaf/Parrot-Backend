const mongoose = require('mongoose')


const chatSchema = new mongoose.Schema({
    chatsWith:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        index: true,
    },
    lastText:{
        type:String,
        required:true
    }
})


const user = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique:true
    },
    password:{
        type: String,
        required: true
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    chats:[chatSchema],
    profile:{
        type:String,
        default:'https://pics.craiyon.com/2024-12-26/4XY9xBHbR-q1AY6AlB8ZAQ.webp'
    },
    profilePictures:[{
        type:String
    }],
    friends:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }],
    friendRequests:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }],
    sentFriendRequests:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }],
    notifications:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Notification"
    }],
    groups:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Group"
        }
    ],
    posts:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Post"
        }
    ],
    likedPosts:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Post"
        }
    ]
},{
    timestamps:true
})

const User = mongoose.model('User',user)

module.exports = User