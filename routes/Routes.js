const routes = require('express').Router( );
const RegisterController = require('../controller/RegisterController');
const LoginController = require('../controller/LoginController');

routes.post('/register', RegisterController.GetUserInfosToRegister);
routes.post('/login', LoginController.GetUserInfosToLogin);

module.exports = routes;