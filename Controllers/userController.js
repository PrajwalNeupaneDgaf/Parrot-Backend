const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');
const User = require("../Models/Users");
const nodeMailer = require('nodemailer')
const cloudinary = require('../Utils/Cloudinary')

//Function to Login

const Login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(500).json({
            message: "Please Fill Your Credentials Properly"
        });
    }
    if (password.length < 6) {
        return res.status(500).json({
            message: "Your Password Is Less Than 6 Characters"
        });
    }

    try {
        // Use findOne instead of find to get a single user object
        const user = await User.findOne({ email: email });

        if (!user) {
            return res.status(404).json({
                message: 'Your email is not registered'
            });
        }

        // Compare the plain password with the hashed password stored in DB
        bcrypt.compare(password, user.password, (err, matched) => {
            if (err) {
                return res.status(500).json({
                    message: "Error while comparing passwords"
                });
            }

            if (!matched) {
                return res.status(401).json({
                    message: "Password didn't Match"
                });
            }

            // If password matches, generate the JWT token
            const token = jwt.sign({ id: user._id }, process.env.SECRET, { expiresIn: '12h' });

            // Set the token in the cookies
            res.cookie('token', token, { httpOnly: true });

            return res.status(200).json({
                user: user,
                message: `Successfully Logged In, welcome ${user.name}`
            });
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || 'some internal Error'
        });
    }
};

//Function to Register 

const Register = async(req,res) =>
{
    const {name,email,password} = req.body

    if(!name || !email || !password){
        return res.status(500).json({
            message:"Fill your Credintial properly"
        })
    }
    if(password.length<6){
        return res.status(500).json({
            message:"Minimum 6 Digits is required"
        })
    }
    try {
         
        const users = await User.findOne({email:email})

        if(users){
            return res.status(500).json({
                message: "Your Email is Already Registered"
            })
        }
        const newUser = new User({
            name:name,
            email:email,
            password: await bcrypt.hash(password,10)
        })

        await newUser.save()

        const token = jwt.sign({id:newUser._id},process.env.SECRET,{expiresIn:"12h"})

        res.cookie('token',token, { httpOnly: true })

        return res.status(200).json({
            user:newUser,
            message:`Succesfully Registered. Welcome ${newUser.name}`
        })



    } catch (error) {
        return res.status(500).json({
            message: error.message || 'some internal Error'
        })
    }
}
//Function to send Email to verify Email
const SendEmail = async (req,res) =>
{

    const user = await User.findById(req.user.id)

    if(!user){
        return res.status(500).json({
            message:"Try Register Again"
        })
    }

    const transporter = nodeMailer.createTransport(
    {
        service:'gmail',
        auth: {
            user: process.env.EMAIL, // Replace with your email
            pass: 'ekgo uqea zmpw mjnf'   // Replace with your email password
        }
    })

    const token = jwt.sign({id:req.user.id},process.env.VERIFICATION,{ expiresIn: '10m' })
    const mailOptions = {
        from: process.env.EMAIL, // sender address
        to:user.email , // list of receivers
        subject: 'Verification Email', // Subject line
        html: `
        <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f7fc;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        width: 100%;
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    h1 {
                        color: #333;
                        text-align: center;
                    }
                    p {
                        color: #555;
                        font-size: 16px;
                        text-align: center;
                    }
                    .btn {
                        display: block;
                        width: 200px;
                        padding: 10px;
                        margin: 20px auto;
                        background-color: #4CAF50;
                        color: white;
                        text-align: center;
                        text-decoration: none;
                        border-radius: 5px;
                        font-size: 16px;
                    }
                    .footer {
                        text-align: center;
                        font-size: 14px;
                        color: #888;
                        margin-top: 30px;
                    }
                    .footer a {
                        color: #4CAF50;
                        text-decoration: none;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Verify Your Email</h1>
                    <p>Thank you for registering with us. Please click the button below to verify your email address and complete your registration process.</p>
                    <a href="${process.env.VERIFICATIONLINK}/${token}" class="btn">Verify Email</a>
                    <p>If you did not create an account, no further action is required.</p>
                </div>
                <div class="footer">
                    <p>Need help? <a href="noteapp283@gmail.com">Contact Support</a></p>
                </div>
            </body>
        </html>
    `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error:', error);
        } else {
           return res.status(200).json({
            message:"Successfully Sent Email, Check Your Email."
           })
        }
    });

}

const VerifyEmail = async (req,res)=>
{
    const {token} = req.params

    try {
        const data = jwt.verify(token,process.env.VERIFICATION)

        const user = await User.findById(data.id)

        if(!user){
            return res.status(500).json({
                message:"Sorry user not found"
            })
        }

        await User.updateOne({ _id: data.id }, { $set: { isVerified: true } });


        return res.status(200).json({
            message:"User Verified "
        })
        
    } catch (error) {
        return res.status(500).json({
            message:"Couldn,t Verify your id"
        })
    }
}

const updatePSD = async (req,res)=>
{
 const {newPassword , oldPassword} = req.body
 if(!newPassword || !oldPassword){
    return res.status(500).json({
        message:"Please fill properly"
    })
 }
 try {
    const user = await User.findById(req.user.id)

    if(!user){
       return res.status(500).json({
           message:"Sorry User Not Found"
       })
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
        return res.status(401).json({
            message: "Old password didn't match.",
        });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne(
        { _id: req.user.id },
        { $set: { password: hashedPassword } }
    )
    return res.status(200).json({
        message:'Succesfully Changed'
    })
 } catch (error) {
    return res.status(500).jso({
        message:'Internal Error ',
        error:error
    })
 }
}

const updateName = async (req,res)=>
{
    const {name} = req.body

    if(!name){
        return res.status(500).json({
            message:"Sorry Please Fill The Name"
        })
    }
    try {
        const user = await User.findById(req.user.id)
        if(!user){
            return res.status(500).json("User Not Found")
        }
        await User.updateOne({_id:req.user.id},{
            $set:{
                name:name
            }
        })
        return res.status(200).json({
            message:"Succesfully Changed Name"
        })
    } catch (error) {
        return res.status(500).json({
            message:"Sorry some Error Occured",
            error:error
        })
    }
}


const UploadPhoto = async (req,res)=>
{
  const {profile}= req.files


  if (!profile) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const id = req.user.id
 

 try {
    const user = await User.findById(id)
    if (!user) {
        return res.status(400).json({ error: 'No User Found or Registered' });
      }
      let link 
      let profiles = user.profilePictures || []

      const result = await cloudinary.uploader.upload(profile.tempFilePath, {
        folder: 'profiles', // Optional: specify folder on Cloudinary
      });
      
      link = result.secure_url
      profiles.unshift(link)

      await User.findByIdAndUpdate(id,{
        $set:{
            profile:link,
            profilePictures:profiles
        }
    })

    return  res.status(200).json({
        message:"Profile Updated Succesfully",
        profiles:profiles,
        link:link
    })
 } catch (error) {
        return res.status(500).json({
            message:'Some Error Occured',
            error:error.message
        })
 }

}

const RemoveProfile = async (req,res)=>{

    const id = req.user.id
    try {
        const user = await User.findById(id)
        if(!user){
            return res.status(500).json({
                message:"No User Found"
            })
        }

        await User.findByIdAndUpdate(id,
        {
            $set:{
                profile:'https://pics.craiyon.com/2024-12-26/4XY9xBHbR-q1AY6AlB8ZAQ.webp'
            }
        })

        return res.status(200).json({
            message:"Profile Removed"
        })
    } catch (error) {
        return res.status(500).json({
            message:"Internal Error Occured",
            error:error.message
        })
    }
}

const SetAsProfile = async (req,res)=>{

    const id = req.user.id
    const {url} = req.body

    try {
        const user = await User.findById(id)

        if(!user){
            return res.status(500).json({
                message:"No User Found"
            })
        }

        await User.findByIdAndUpdate(id,
        {
            $set:{
                profile:url
            }
        })

        return res.status(200).json({
            message:"Profile Set Completed"
        })
    } catch (error) {
        return res.status(500).json({
            message:"Internal Error Occured",
            error:error.message
        })
    }
}

const DeleteImage = async (req,res) => {

    const {imageUrl} = req.body

    const id = req.user.id

    const user = await User.findById(id)

    if(!user)
    {
        return res.status(500).json({
            message:"User Not Found",
        })
    }

    const profiles = user.profilePictures || []


    if(!profiles.includes(imageUrl))
    {
      return res.status(500).json({
        message:"Doesn't Belongs To You",
     })
    }

    const data = imageUrl.split('/')[7]+'/'+imageUrl.split('/')[8];
    const publicId = data.split('.')[0]
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      if (result.result === 'ok') {
        const actualProfiles = profiles.filter(profile=> profile!=imageUrl)

        if(user.profile == imageUrl){
            await User.findByIdAndUpdate(id,{
                $set:{
                    profile:'https://pics.craiyon.com/2024-12-26/4XY9xBHbR-q1AY6AlB8ZAQ.webp'
                }
            })
        }

        await User.findByIdAndUpdate(id,{
            $set:{
               profilePictures: actualProfiles
            }
        })

        return res.status(200).json({
            message:"Image SuccesFully Deleted",
        })
      } else {
        return res.status(500).json({
            message:"Some Error Occured",
        })
      }
    } catch (error) {
     return res.status(500).json({
        message:"Some Error Occured",
        error:error.message
     })
    }
  };
  
  const GetMyData = async (req,res)=>
  {
    const id = req.user.id

    try {
        if(!id){
            return res.status(400).json({
                message:"You Are Not Authorized"
            })
        }

        const user = await User.findById(id)

        if(!user){
            return res.status(400).json({
                message:"You Are Not Found In Database"
            })
        }

        return res.status(200).json({
            data:user
        })
    } catch (error) {
            return res.status(500).json({
                message:"Some Error Occured",
                error:error.message
            })
    }
  }

  const DeleteAccount = async (req,res)=>{
    const {password} = req.body
    const id = req.user.id

    try {
        const user = await User.findById(id)

        if(!user){
            return res.status(500).json({
                message:"Sorry Can't Find Your ID",
            })
        }

        if(!user.isVerified){
            await User.findByIdAndDelete(id)
            return res.status(200).json({
                message:"Deleted SuccesFully"
            })
        }else{
            bcrypt.compare(password, user.password, async (err, matched) => {
                if (err) {
                    return res.status(500).json({
                        message: "Error while comparing passwords"
                    });
                }
    
                if (!matched) {
                    return res.status(401).json({
                        message: "Password didn't Match"
                    });
                }
                await User.findByIdAndDelete(id)
                return res.status(200).json({
                message:"Deleted SuccesFully"
            })
            })
        }
    } catch (error) {
        return res.status(500).json({
            message:"Sorry Can't Delete Your ID",
            error:error.message
        })
    }
  }

  const HandleLogout = async (req, res) => {
    try {
      // Clear the cookie with the name 'token'
      res.clearCookie('token', {
        httpOnly: true, // Ensures the cookie can't be accessed via JavaScript
      });
  
      // Respond with a success message
      return res.status(200).json({
        message: 'Logged out successfully',
      });
    } catch (error) {
      return res.status(500).json({
        message: 'An error occurred during logout',
        error: error.message,
      });
    }
  };

  const forgetPassword = async (req,res) =>
    {
        const {email} = req.body

        const user = await User.findOne({email:email})
    
        if(!user){
            return res.status(500).json({
                message:"Your Email Is Not Registered"
            })
        }
    
        const transporter = nodeMailer.createTransport(
        {
            service:'gmail',
            auth: {
                user: process.env.EMAIL, // Replace with your email
                pass: 'ekgo uqea zmpw mjnf'   // Replace with your email password
            }
        })
    
        const token = jwt.sign({id:user._id},process.env.FORGET,{ expiresIn: '10m' })
        const mailOptions = {
            from: process.env.EMAIL, // sender address
            to:user.email , // list of receivers
            subject: 'RESET PASSWORD', // Subject line
            html: `
            <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f4f7fc;
                            margin: 0;
                            padding: 0;
                        }
                        .container {
                            width: 100%;
                            max-width: 600px;
                            margin: 0 auto;
                            background-color: #ffffff;
                            padding: 20px;
                            border-radius: 8px;
                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        }
                        h1 {
                            color: #333;
                            text-align: center;
                        }
                        p {
                            color: #555;
                            font-size: 16px;
                            text-align: center;
                        }
                        .btn {
                            display: block;
                            width: 200px;
                            padding: 10px;
                            margin: 20px auto;
                            background-color: #4CAF50;
                            color: white;
                            text-align: center;
                            text-decoration: none;
                            border-radius: 5px;
                            font-size: 16px;
                        }
                        .footer {
                            text-align: center;
                            font-size: 14px;
                            color: #888;
                            margin-top: 30px;
                        }
                        .footer a {
                            color: #4CAF50;
                            text-decoration: none;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Reset Your Password</h1>
                        <p>We kindly request you to click below link and reset password </p>
                        <a href="${process.env.VERIFICATIONLINK}/reset-password/${token}" class="btn">Reset Password</a>
                        <p>If you did not create an account, no further action is required.</p>
                    </div>
                    <div class="footer">
                        <p>Need help? <a href="mailto:noteapp283@gmail.com">Contact Support</a></p>
                    </div>
                </body>
            </html>
        `
        };
    
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error:', error);
            } else {
               return res.status(200).json({
                message:"Successfully Sent Email, Check Your Email."
               })
            }
        });
    
    }

    const VerifyForgetLink = async(req,res)=>{
        const {token , newPassword} = req.body

        if(!token){
            return res.status(500).json({
                message:'No Token Found'
            })
        }
        if(newPassword.length<6){
            return res.status(500).json({
                message:'Minimum 6 Digits in Password'
            })
        }
        try {
            const data = jwt.verify(token,process.env.FORGET)
            
            const user = await User.findById(data.id)
    
            if(!user){
                return res.status(500).json({
                    message:"Invalid Token Try Again"
                })
            }

            const hashedPassword = await bcrypt.hash(newPassword,10)
    
            await User.updateOne({ _id: data.id }, { $set: { password: hashedPassword } });
    
    
            return res.status(200).json({
                message:"Password Reset Succesfull"
            })
            
        } catch (error) {
            return res.status(500).json({
                message:"Couldn,t Verify your id"
            })
        }


    }


module.exports = {
    Login,
    Register,
    SendEmail,
    VerifyEmail,
    updatePSD,
    updateName,
    UploadPhoto,
    RemoveProfile,
    SetAsProfile,
    DeleteImage,
    GetMyData,
    DeleteAccount,
    HandleLogout,
    forgetPassword,
    VerifyForgetLink,
    

};
