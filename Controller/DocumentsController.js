const { cpf } = require('cpf-cnpj-validator');
const Db = require('../db/Db');

const GetDocumentsToValidate = async ( req, res ) => {
    const { cpfNumber, rg, cellPhone, bornDate, id } = req.body;

    const isValid = cpf.isValid(cpfNumber);

    if(!isValid) {
        return res.status(400).send('Invalid Docs');
    }

    try {
        await Db.User.findByIdAndUpdate({_id: id}, {cpf: cpfNumber, rg: rg, cellPhone: cellPhone, bornDate: bornDate});

        return res.send(id);
    } catch (err) {
        console.log(err);
    }
    
    return res.send(isValid);
}

module.exports = {GetDocumentsToValidate}