const GetUserInfosToRegister = async (req, res) => {
    const {name, password, confirmPassword, email} = req.body;

    console.log(name, password, confirmPassword, email);


    res.send(name)
}

module.exports = {
    GetUserInfosToRegister
}