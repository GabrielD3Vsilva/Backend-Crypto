const routes = require('express').Router( );
const RegisterController = require('../controller/RegisterController');

routes.post('/register', RegisterController.GetUserInfosToRegister);

module.exports = routes;