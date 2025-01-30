const mongoose = require('mongoose')

const group = new mongoose.Schema({
    Name:{
        type: String,
        required: true
    },
    Profile:{
        type:String,
        default:'https://img.freepik.com/premium-photo/group-different-parrot-species-white-background_984027-120739.jpg'
    },
    GroupStatus:{
        type:String,
        default:'Public',
        enum:['Private','Public']
    },
    Requests:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }],
    Members:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }],
    CreatedBy:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"User"
    },
    Posts:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Post"
        }
    ],
},{
    timestamps:true
})

const Group = mongoose.model('Group',group)

module.exports = Group