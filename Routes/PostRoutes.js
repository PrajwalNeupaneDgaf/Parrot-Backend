const express = require('express');
const Auth  = require('../middleWare/Auth');
const { CreatePost, getPost, updatePost, deletePost, manageLike, getPostData, addComment, addReply, LikeComment, editComment, deleteComment, editReply, deleteReply } = require('../Controllers/PostController');
const { getHomePagePost } = require('../Controllers/HomePageController');


const router = express.Router()

router.post('/create',Auth,CreatePost)
router.get('/homepage',Auth,getHomePagePost)
router.post('/addComment/:postId',Auth,addComment)
router.post('/addreply/:postId/:commentId',Auth,addReply)
router.get('/likecomment/:postId/:commentId',Auth,LikeComment)
router.put('/editcomment/:postId/:commentId',Auth,editComment)
router.put('/editreply/:postId/:commentId/:replyId',Auth,editReply)
router.get('/get/:postId',Auth,getPost)
router.get('/details/:postId',Auth,getPostData)
router.get('/like/:postId',Auth,manageLike)
router.put('/update/:postId',Auth,updatePost)
router.delete('/delete/:postId',Auth,deletePost)
router.delete('/deletecomment/:postId/:commentId',Auth,deleteComment)
router.delete('/deletereply/:postId/:commentId/:replyId',Auth,deleteReply)


module.exports = router;