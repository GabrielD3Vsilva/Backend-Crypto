const routes = require('express').Router( );
const Db = require('../db/Db');


routes.post('/register', async ( req, res ) => {
    const {name, email, password} = req.body;
    return res.send('ok');
   

})


module.exports = routes;