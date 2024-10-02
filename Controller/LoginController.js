const Db = require('../db/Db');

const DoLoginInDb = async ( req, res ) => {
    const { email, password } = req.body;

    const user = await Db.User.findOne({
        email: email,
        password: password
    });

    if(user) {
        return res.status(200).send({wallet: user.wallet});
    }

    return res.status(400).send('User dont exists');
}

module.exports = {DoLoginInDb}