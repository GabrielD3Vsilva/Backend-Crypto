const routes = require('express').Router();

const RegisterController = require('../Controller/RegisterController');
const LoginController = require('../Controller/LoginController');

routes.post('/register', RegisterController.DoRegisterInDb);
routes.post('/login', LoginController.DoLoginInDb);

module.exports = routes;
