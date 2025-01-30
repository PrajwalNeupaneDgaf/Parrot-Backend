const express = require('express');
const Auth  = require('../middleWare/Auth');
const { getGroupData, getDataForUpdate, CreateGroup, updateGroup, JoinGroup, handleRequests, removeUser, getUserGroups, LeaveGroup, cancelRequest } = require('../Controllers/Groupcontroler');

const router = express.Router()

router.get('/data/:groupId',Auth , getGroupData)
router.get('/all',Auth , getUserGroups)
router.get('/data/update/:groupId',Auth , getDataForUpdate)
router.post('/create',Auth , CreateGroup)
router.post('/manage-request/:groupId',Auth , handleRequests)
router.put('/update/:groupId',Auth , updateGroup)
router.put('/remove-user/:groupId/:requestId',Auth , removeUser)
router.get('/join/:groupId',Auth , JoinGroup)
router.get('/leave/:groupId',Auth , LeaveGroup)
router.get('/cancel/:groupId',Auth , cancelRequest)

module.exports = router;