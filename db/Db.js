const mongoose = require('mongoose');

mongoose.connect("mongodb+srv://gbrieloliveira264:1981abcd.@cluster0.vej7o.mongodb.net/")
.then(( )=>console.log('mongoDb Connected'))
.catch((error)=>console.log(error));

const UserSchema = new mongoose.schema({
    name: String,
    email: String,
    password: String,
    isValidateDocuments: Boolean
});

module.exports = {
    User: mongoose.model('User', UserSchema)
}
