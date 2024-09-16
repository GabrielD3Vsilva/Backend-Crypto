const Db = require('../db/Db');

const GetUserInfosToLogin = async ( req, res ) => {
    const {email, password} = req.body;

    const user = await Db.User.find({
        email: email,
        password: password
    });

    if(!user) {
        return res.status(400);
    }
    return res.status(200).json(user);

}




module.exports = {
    GetUserInfosToLogin
}