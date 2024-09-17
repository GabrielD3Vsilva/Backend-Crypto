const routes = require('express').Router();
const Db = require('../db/Db');
const RegisterController = require('../Controller/RegisterController');

routes.post('/register', RegisterController.DoRegisterInDb);

module.exports = routes;
