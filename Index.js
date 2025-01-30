const dotenv = require('dotenv')
dotenv.config()

const express = require('express')
const cors = require('cors')

const expressfileUpload = require('express-fileupload')
const connectDB = require('./DB/db')

const cookieParser = require('cookie-parser')

const userRouter = require('./Routes/UserRouter')
const profileRouter = require('./Routes/ProfileRoutes')
const postRouter = require('./Routes/PostRoutes')
const SearchRouter = require('./Routes/SearchRoutes')
const FriendRouter = require('./Routes/FriendsRoute')
const notificationRouter = require('./Routes/NotificationRoutes')
const messageRouter = require('./Routes/MessageRoutes')
const groupRouter = require('./Routes/GroupsRoutes')


const {app , server} = require('./Utils/Socket')

app.use(expressfileUpload({
    useTempFiles:true
}))

app.use(cors({
    origin: ['http://localhost:5173', 'http://www.localhost:5173',"https://parrotp1.netlify.app"], 
    credentials: true, // Allow cookies and credentials
}));

app.use(express.json())

app.use(cookieParser());

app.use(express.urlencoded({extended:true}))

connectDB()


app.use('/api/user',userRouter)
app.use('/api/profile',profileRouter)
app.use('/api/post',postRouter)
app.use('/api',SearchRouter)
app.use('/api',notificationRouter)
app.use('/api/friend',FriendRouter)
app.use('/api/message',messageRouter)
app.use('/api/group',groupRouter)


server.listen(process.env.PORT,()=>{
    console.log('Server is Running on ',process.env.PORT)
})

