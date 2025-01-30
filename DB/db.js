const mongoose = require('mongoose')

const connectDB =  async ()=>{
try {
    mongoose.connect(process.env.URI,{})
    console.log('We are Connected')
} catch (error) {
    console.log(error)
}
} 

module.exports = connectDB