const routes = require('express').Router();
const Db = require('../db/Db');

routes.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    const user = await Db.User.findOne({
        email: email
    });

    if (user) {
        return res.status(400).send('User already exists');
    }

    try {
        await Db.User.create({
            name: name,
            email: email,
            password: password,
            isValidateDocuments: false
        });

        return res.send('ok');
    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error');
    }
});

module.exports = routes;
