const Db = require('../db/Db');

const GetUserInfosToRegister = async (req, res) => {
    const {name, password, confirmPassword, email} = req.body;

    const passwordIsEqual = validateIfPasswordsIsEqual(password, confirmPassword);

    if(!passwordIsEqual) {
        return res.status(400);
    }

    const userExist = await validateIfUserExists(email);

    if(!userExist) {
        await createUser(name, password, email);

        return res.send("ok");
    }
    return res.status(400);
 


}

const validateIfPasswordsIsEqual = ( password, confirmPassword ) => {
        if(password !== confirmPassword) {
            return false;
        }
        return true;
}

const validateIfUserExists = async ( email ) => {
    const user = await Db.User.find({email: email});

    if(!user) {
        return false;
    }
    return true;
}


const createUser = async ( nameUser ,email, password ) => {
    await Db.User.create({
        name: nameUser,
        email: email,
        password: password,
        isValidateDocuments: false
    });
}



module.exports = {
    GetUserInfosToRegister
}