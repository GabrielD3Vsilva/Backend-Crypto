const mongoose = require('mongoose');

mongoose.connect("mongodb+srv://gbrieloliveira264:1981abcd.@cluster0.6cvez.mongodb.net/")
.then(( )=>console.log('mongoDb Connected'))
.catch((error)=>console.log(error));

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    cellPhone: Number,
    cpf: Number,
    rg: Number,
    bornData: Number,
    isValidateDocuments: Boolean,
    wallet: String,
    pK: String,
    walletSolana: String,
    pKSolana: Array
});

module.exports = {
    User: mongoose.model('User', UserSchema)
}
