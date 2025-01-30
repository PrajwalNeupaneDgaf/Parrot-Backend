const Group = require('../Models/Group')
const Notification = require('../Models/Notification')
const Posts = require('../Models/Posts')
const User = require('../Models/Users')

const cloudinary = require('../Utils/Cloudinary')

const CreatePost = async (req, res) => {
    const { Text, PostedAt } = req.body
    if (req.files) {
        var { image } = req.files
    }

    const id = req.user.id

    if (!Text && !image) {
        return res.status(500).json({
            message: "Please Provide Some Data"
        })
    }

    const user = await User.findById(id)

    if (!user) {
        return res.status(500).json({
            message: "User Not Found"
        })
    }
    let Image
    try {
        if (image) {
            const result = await cloudinary.uploader.upload(image.tempFilePath, {
                folder: 'posts',
            });
            Image = result.secure_url
        }
        const newPost = new Posts({
            Text: Text,
            PostedAt: PostedAt,
            Image: Image,
            PostedBy: user._id

        })

        await newPost.save()

        if (PostedAt) {
            const group = await Group.findById(PostedAt)

            if (!group) {
                return res.status(500).json({
                    message: "Group Not Found"
                })
            }
            let groupPosts = group.Posts || []

            groupPosts.unshift(newPost._id)

            await Group.updateOne({ _id: group._id }, {
                $set: { Posts: groupPosts }
            })
        }
        else {
            let userPosts = user.posts || []

            userPosts.unshift(newPost._id)

            await User.updateOne({ _id: id }, {
                $set: {
                    posts: userPosts
                }
            })
        }

        return res.status(200).json({
            message: 'Posted Successfully'
        })

    } catch (error) {
        return res.status(500).json({
            message: "Some Error Occuer",
            error: error
        })
    }
}

const getPost = async (req, res) => {
    const { postId } = req.params

    if (!postId) {
        return
    }

    try {
        const post = await Posts.findById(postId)
        if (!post) {
            return res.status(500).json({
                message: "Post Not Found",
            })
        }
        const user = await User.findById(req.user.id)

        let isMinePost = post.PostedBy.toString()===user._id.toString()?true:false

        if (!isMinePost) {
            return res.status(500).json({
                message: "Post Not Yours",
            })
        }

        return res.status(200).json(post)
    } catch (error) {
        return res.status(500).json({
            message: "Some Error Occuer",
            error: error
        })
    }
}

const updatePost = async (req, res) => {
    const { postId } = req.params

    const { Text } = req.body

    if (req.body.imageLink) {
        var { imageLink } = req.body
    }
    if (req.files) {
        var { image } = req.files
    }

    if (!Text && !image && !imageLink) {
        return res.status(500).json({
            message: "Can't be empty"
        })
    }

    if (!postId) {
        return res.status(500).json({
            message: "Can't be empty"
        })
    }

    try {
        const post = await Posts.findById(postId)
        if (!post) {
            return res.status(500).json({
                message: "Post Not Found",
            })
        }
        const user = await User.findById(req.user.id)

        let posts = user.posts || []
        let isMinePost = post.PostedBy.toString()===user._id.toString()?true:false

        if (!isMinePost) {
            return res.status(500).json({
                message: "Post Not Yours",
            })
        }
        let Image
        if (image) {
            if (imageLink) {
                const data = imageUrl.split('/')[7] + '/' + imageUrl.split('/')[8];
                const publicId = data.split('.')[0]
                const results = await cloudinary.uploader.destroy(publicId);
            }

            const result = await cloudinary.uploader.upload(image.tempFilePath, {
                folder: 'posts',
            });
            Image = result.secure_url

            await Posts.findByIdAndUpdate(postId, {
                $set: {
                    Image: Image,
                    Text: Text
                }
            })
            return res.status(200).json({
                message: "Update Was Succesfull"
            })
        } else {
            await Posts.findByIdAndUpdate(postId, {
                $set: {
                    Image: imageLink ? imageLink : '',
                    Text: Text
                }
            })
        }


        return res.status(200).json({
            message: "Update Was Succesfull"
        })
    } catch (error) {
        return res.status(500).json({
            message: "Some Error Occuer",
            error: error
        })
    }
}

const deletePost = async (req, res) => {
    const { postId } = req.params
    if (!postId) {
        return
    }

    try {
        const post = await Posts.findById(postId)
        if (!post) {
            return res.status(500).json({
                message: "Post Not Found",
            })
        }
        const user = await User.findById(req.user.id)

        let posts = user.posts || []
        let isMinePost = post.PostedBy.toString()===user._id.toString()?true:false

        if (!isMinePost) {
            return res.status(500).json({
                message: "Post Not Yours",
            })
        }

        if (post.Image) {
            let imageUrl = post.Image
            const data = imageUrl.split('/')[7] + '/' + imageUrl.split('/')[8];
            const publicId = data.split('.')[0]
            const results = await cloudinary.uploader.destroy(publicId);
        }

        await Posts.findByIdAndDelete(postId)

        return res.status(200).json('Successfully Deleted')

    } catch (error) {
        return res.status(500).json({
            message: "Some Error Occuer",
            error: error
        })
    }
}

const manageLike = async (req, res) => {
    const { postId } = req.params

    const id = req.user.id

    try {
        const post = await Posts.findById(postId)
        if (!post) {
            return res.status(500).json({
                message: "Post Not Found",
            })
        }
        const userPosted = await User.findById(post.PostedBy)
        const user = await User.findById(id)
        if (!user) {
            return res.status(500).json({
                message: "Post Not Found",
            })
        }

        let LikedBy = post.LikedBy || []

        let isAlreadyLiked = LikedBy.filter(itm => itm.toString() === user._id.toString())
        if (isAlreadyLiked?.length !== 0) {
            LikedBy = LikedBy.filter(itm => itm.toString() !== user._id.toString())
            await Posts.findByIdAndUpdate(postId, {
                $set: {
                    LikedBy: LikedBy
                }
            })
        } else {
            if (userPosted && userPosted._id.toString() !== user._id.toString()) {
                let notifications = userPosted.notifications || []

                let notification = new Notification({
                    User: userPosted._id,
                    By:user._id,
                    Title: "Liked your Post",
                    Description: `${user.name} ${LikedBy?.length > 0 ? 'and ' + LikedBy.length + " Other " : " "} Liked Your Post`,
                    Link: `/post/details/${postId}`
                })

                await notification.save()

                notifications.unshift(notification._id)

                await User.findByIdAndUpdate(userPosted._id, {
                    $set: {
                        notifications: notifications
                    }
                })

            }
            LikedBy.push(id)
            await Posts.findByIdAndUpdate(postId, {
                $set: {
                    LikedBy: LikedBy
                }
            })
        }
        return res.status(200).json({
            message: "Succesfull",
        })
    } catch (error) {
        return res.status(500).json({
            message: "Some Error Occuer",
            error: error
        })
    }
}

const getPostData = async (req, res) => {
    const { postId } = req.params

    if (!postId) {
        return
    }

    try {
        const post = await Posts.findById(postId)
            .populate({
                path: 'Comments',
                populate: [
                    {
                        path: 'By',
                        select: '_id name profile'
                    },
                    {
                        path: 'Replies',
                        populate: {
                            path: 'By',
                            select: '_id name profile'
                        }
                    }
                ]
            })
            .populate({
                path: 'PostedBy',
                select: 'name profile _id'
            }) .populate({
                path: 'LikedBy',
                select: 'name profile _id'
            }).populate({
                path: 'PostedAt',
                select: 'Name Profile _id'
            })

        if (!post) {
            return res.status(500).json({
                message: "Post Not Found",
            })
        }

        return res.status(200).json(post)
    } catch (error) {
        return res.status(500).json({
            message: "Some Error Occuer",
            error: error
        })
    }
}

const addComment = async (req, res) => {
    const { postId } = req.params

    const { Text } = req.body

    const id = req.user.id

    try {
        const post = await Posts.findById(postId)
        if (!post) {
            return res.status(500).json({
                message: "Post Not Found",
            })
        }
        const userPosted = await User.findById(post.PostedBy)
        const user = await User.findById(id)
        if (!user) {
            return res.status(500).json({
                message: "Post Not Found",
            })
        }

        const Comment = {
            By: id,
            Text: Text
        }

        post.Comments.push(Comment)

        await post.save()

        let postComments = post.Comments || []

        if (userPosted && userPosted._id.toString() !== user._id.toString()) {
            let notifications = userPosted.notifications || []

            let notification = new Notification({
                User: userPosted._id,
                By: id,
                Title: "Commented on your Post",
                Description: `${user.name} ${postComments?.length > 1 ? 'and ' + postComments.length-1 + " Other " : " "} Commented on Your Post`,
                Link: `/post/details/${postId}`
            })

            await notification.save()

            notifications.unshift(notification._id)

            await User.findByIdAndUpdate(userPosted._id, {
                $set: {
                    notifications: notifications
                }
            })

        }

        return res.status(200).json({
            message: "Succesfull",
        })
    } catch (error) {
        return res.status(500).json({
            message: "Some Error Occuer",
            error: error
        })
    }
}

const addReply = async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const { Text } = req.body;
        const userId = req.user.id
        if (!Text) {
            return res.status(400).json({ message: 'Reply text is required.' });
        }

        const post = await Posts.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        const comment = post.Comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found.' });
        }

        const reply = {
            By: userId,
            Text: Text,
        };

        comment.Replies.push(reply);

        await post.save();

        const userPosted = await User.findById(post.PostedBy)
        const user = await User.findById(userId)

        if (userPosted && comment?.By?._id.toString() !== user._id.toString()) {
            let notifications = userPosted.notifications || []

            let notification = new Notification({
                User: userPosted._id,
                By: userId,
                Title: "Replied on your Comment",
                Description: `${user.name} ${post?.Comments?.Replies?.length > 0 ? 'and ' + post?.Comments?.Replies?.length + " Other " : " "} Replied To Your Comment`,
                Link: `/post/details/${postId}`
            })

            await notification.save()

            notifications.unshift(notification._id)

            await User.findByIdAndUpdate(userPosted._id, {
                $set: {
                    notifications: notifications
                }
            })

        }

        res.status(201).json({
            message: 'Reply added successfully.',
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server error.' });
    }
};

const LikeComment = async (req,res)=>
{

    try {
        const { postId, commentId } = req.params;
        const userId = req.user.id
        const post = await Posts.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        const comment = post.Comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found.' });
        }

        const user = await User.findById(userId)

        let likes = comment.LikedBy || []

        const isAlreadyLiked = likes.filter(itm=>itm.toString()===user._id.toString())

        if(isAlreadyLiked?.length>0){
            const Liked = likes.filter(itm=>itm.toString()!==user._id.toString())
            comment.LikedBy = Liked
            await post.save()

            return res.status(200).json({
                message:"Succesfull"
            })
        }

        comment.LikedBy.push(userId);

        await post.save();

        const userCommented = await User.findById(comment.By)
        

        if (userCommented && comment?.By?._id.toString() !== user._id.toString()) {
            let notifications = userCommented.notifications || []

            let notification = new Notification({
                User: userCommented._id,
                By: userId,
                Title: "Liked  your Comment",
                Description: `${user.name} ${comment?.LikedBy?.length > 0 ? 'and ' + comment?.LikedBy?.length + " Other " : " "} Liked  Your Comment`,
                Link: `/post/details/${postId}`
            })

            await notification.save()

            notifications.unshift(notification._id)

            await User.findByIdAndUpdate(userCommented._id, {
                $set: {
                    notifications: notifications
                }
            })

        }

        res.status(201).json({
            message: 'Reply added successfully.',
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server error.' });
    }
}   

const editComment = async (req,res) => {
    try {
        const id = req.user.id

        const {postId , commentId} = req.params
        const {newText} = req.body
        const user = await User.findById(id)

        const post = await Posts.findById(postId);
        if (!post) throw new Error('Post not found');

        const comment = post.Comments.id(commentId);
        if (!comment) throw new Error('Comment not found');

        if(comment.By.toString()!==user._id.toString()){
            throw new Error('Not Your Comment')
        }
        comment.Text = newText; // Update the comment text
        await post.save(); // Save the changes

        return res.status(200).json({ message: 'Comment updated successfully' });
    } catch (error) {
        return res.status(500).json({ 
            message: error.message 
        });
    }
};

const deleteComment = async (req, res) => {
    try {
        const id = req.user.id; // User ID from authenticated request
        const { postId, commentId } = req.params; // Extract postId and commentId from request params

        const user = await User.findById(id); // Find the authenticated user
        if (!user) throw new Error('User not found');

        const post = await Posts.findById(postId); // Find the post
        if (!post) throw new Error('Post not found');

        const comment = post.Comments.id(commentId); // Find the comment in the post
        if (!comment) throw new Error('Comment not found');

        if (comment.By.toString() !== user._id.toString()) {
            throw new Error('Not your comment'); // Ensure the user owns the comment
        }

        // Remove the comment
        post.Comments = post.Comments.filter(c => c._id.toString() !== commentId);
        await post.save(); // Save changes to the post

        return res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
        return res.status(500).json({ 
            message: error.message 
        });
    }
};

const editReply = async (req, res) => {
    try {
        const id = req.user.id; // User ID from authenticated request
        const { postId, commentId, replyId } = req.params; // Extract postId, commentId, and replyId
        const { newText } = req.body;

        const user = await User.findById(id); // Find the authenticated user
        if (!user) throw new Error('User not found');

        const post = await Posts.findById(postId); // Find the post
        if (!post) throw new Error('Post not found');

        const comment = post.Comments.id(commentId); // Find the comment in the post
        if (!comment) throw new Error('Comment not found');

        const reply = comment.Replies.id(replyId); // Find the reply in the comment
        if (!reply) throw new Error('Reply not found');

        if (reply.By.toString() !== user._id.toString()) {
            throw new Error('Not your reply'); // Ensure the user owns the reply
        }

        reply.Text = newText; // Update the reply text
        await post.save(); // Save the changes

        return res.status(200).json({ message: 'Reply updated successfully' });
    } catch (error) {
        return res.status(500).json({ 
            message: error.message 
        });
    }
};

const deleteReply = async (req, res) => {
    try {
        const id = req.user.id; // User ID from authenticated request
        const { postId, commentId, replyId } = req.params; // Extract postId, commentId, and replyId

        const user = await User.findById(id); // Find the authenticated user
        if (!user) throw new Error('User not found');

        const post = await Posts.findById(postId); // Find the post
        if (!post) throw new Error('Post not found');

        const comment = post.Comments.id(commentId); // Find the comment in the post
        if (!comment) throw new Error('Comment not found');

        const reply = comment.Replies.id(replyId); // Find the reply in the comment
        if (!reply) throw new Error('Reply not found');

        if (reply.By.toString() !== user._id.toString()) {
            throw new Error('Not your reply'); // Ensure the user owns the reply
        }

        // Remove the reply
        comment.Replies = comment.Replies.filter(r => r._id.toString() !== replyId);
        await post.save(); // Save changes to the post

        return res.status(200).json({ message: 'Reply deleted successfully' });
    } catch (error) {
        return res.status(500).json({ 
            message: error.message 
        });
    }
};



module.exports = {
    CreatePost,
    getPost,
    updatePost,
    deletePost,
    manageLike,
    getPostData,
    addComment,
    addReply,
    LikeComment,
    editComment,
    deleteComment,
    editReply,
    deleteReply
}