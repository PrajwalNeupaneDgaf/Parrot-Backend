const mongoose = require('mongoose');

// Define the Reply schema
const replySchema = mongoose.Schema({
    By: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    Text: {
        type: String,
        required: true,
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt
});

// Define the Comment schema
const commentSchema = mongoose.Schema({
    By: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    Text: {
        type: String,
        required: true,
    },
    LikedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the users who liked the comment
        default: [],
    }],
    Replies: [replySchema], // Embed the reply schema
}, {
    timestamps: true, // Adds createdAt and updatedAt
});

// Define the Post schema
const postSchema = mongoose.Schema({
    Text: {
        type: String,
    },
    PostedAt:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
    },
    Image:{
        type: String,
    },
    PostedBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    LikedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: [],
    }],
    Comments: [commentSchema], // Embed the comment schema
}, {
    timestamps: true, // Adds createdAt and updatedAt for posts
});

const Posts = mongoose.model('Post', postSchema);
module.exports = Posts;
