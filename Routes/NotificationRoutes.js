const express = require('express');
const Auth  = require('../middleWare/Auth');
const { getMyNotification, markAllAsRead } = require('../Controllers/NotificationController');

const router = express.Router()

router.get('/getnotifications',Auth,getMyNotification)
router.put('/notification/markallasread',Auth,markAllAsRead)


module.exports = router;