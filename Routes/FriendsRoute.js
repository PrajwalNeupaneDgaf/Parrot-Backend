const express = require('express');
const Auth  = require('../middleWare/Auth');
const { sendRequest, getFriends, cancelRequest, unfriend, acceptRequest } = require('../Controllers/FriendsController');

const router = express.Router()

router.get('/send-request/:userId',Auth,sendRequest)
router.get('/getall',Auth,getFriends)
router.post('/cancel-request',Auth,cancelRequest)
router.post('/accept-request',Auth,acceptRequest)
router.post('/unfriend/:receiver',Auth,unfriend)


module.exports = router;