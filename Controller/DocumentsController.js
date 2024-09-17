const { cpf } = require('cpf-cnpj-validator');

const GetDocumentsToValidate = async ( req, res ) => {
    const { cpfNumber, rg, cellphone, bornDate } = req.body;

    const isValid = cpf.isValid(cpfNumber);

    return res.send(isValid);
}

module.exports = {GetDocumentsToValidate}