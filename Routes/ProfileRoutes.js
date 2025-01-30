const express = require('express');
const Auth  = require('../middleWare/Auth');
const { profileData } = require('../Controllers/ProfileController');

const router = express.Router()

router.get('/data/:userId',Auth,profileData)


module.exports = router;