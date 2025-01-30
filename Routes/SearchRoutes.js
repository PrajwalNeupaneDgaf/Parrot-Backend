const express = require('express');
const Auth  = require('../middleWare/Auth');
const { Search } = require('../Controllers/SearchController');


const router = express.Router()

router.get('/search/:query',Auth,Search)


module.exports = router;