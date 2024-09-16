const routes = require('express').Router( );
const Db = require('../db/Db');


routes.post('/register', async ( req, res ) => {
    const {name, email, password, confirmPassword} = req.body;
    return res.status(200);
   /* if(password !== confirmPassword) {
        return res.status(400);
    }

    const user = await Db.User.findOne({
        email: email
    });

    if(!user) {
        return res.status(400);
    }

    try {
        await Db.User.create({
            name: name,
            email: email,
            password: password,
            isValidateDocuments: false
        });

        return res.status(200);
    } catch (err) {
        console.error(err);
    }*/

})


module.exports = routes;