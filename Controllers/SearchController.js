const Group = require("../Models/Group");
const User = require("../Models/Users");

const Search = async (req, res) => {
    const { query } = req.params;
    const id = req.user.id

    if (!query) {
        return res.status(400).json({
            message: 'Enter Some Query'
        });
    }

    try {

        const people = await User.find({
            name: { $regex: query, $options: 'i' }, // Case-insensitive match
            _id: { $ne: id }
        });


        const groups =  await Group.find({
            Name:{$regex:query , $options: 'i'}
        })

        // 4. Return the results to the client
        return res.status(200).json({
            message: 'Search results found',
            people: people || [],
            groups:groups || []
        });
    } catch (error) {
        // 5. Handle any errors
        return res.status(500).json({
            message: 'Some Error Occurred',
            error: error.message // Send error message to help debug
        });
    }
};

module.exports = {
    Search
}