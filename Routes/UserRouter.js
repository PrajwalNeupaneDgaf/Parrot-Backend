const express = require('express');
// const multer = require('multer');
// const upload = multer({ storage: storage });
const Auth  = require('../middleWare/Auth');
const { 
    GetMyData, Register, Login, SendEmail, VerifyEmail, 
    RemoveProfile, UploadPhoto, SetAsProfile, DeleteImage, 
    DeleteAccount,
    HandleLogout,
    updatePSD,
    updateName,
    forgetPassword,
    VerifyForgetLink
} = require('../Controllers/userController');

const router = express.Router();
// const storage = multer.memoryStorage();


router.post('/register', Register);
router.post('/login', Login);

router.get('/getmydata', Auth, GetMyData);
router.get('/logout', Auth, HandleLogout);
router.post('/sendemail', Auth, SendEmail);
router.post('/verify/:token',Auth, VerifyEmail);
router.put('/updateid/password',Auth,updatePSD  );
router.put('/updateid/name',Auth,updateName  );
router.post('/uploadphoto', Auth, UploadPhoto);
router.post('/forget-password', forgetPassword ); 
router.post('/reset-password',  VerifyForgetLink);
router.get('/removeprofile',Auth,  RemoveProfile);
router.put('/setasprofile', Auth, SetAsProfile);
router.post('/deleteimage', Auth, DeleteImage);
router.delete('/deleteaccount', Auth, DeleteAccount);

module.exports = router;
