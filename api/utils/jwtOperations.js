const jwt = require('jsonwebtoken');

const secretKey = process.env.SECRET_KEY;

const jwtOperation = {
    encrypt: data => {
        try {
            var token = jwt.sign(data, secretKey);
            return token;
        }
        catch (exception) {
            return expection;
        }
    },
    decrypt: jwtFromReq => {
        // handle the error in case of a mismatching JWT signature
        try {
            var data = jwt.verify(jwtFromReq, secretKey);
            return data;
        }
        catch (exception) {
            return exception;
        }
    },
}

module.exports = jwtOperation;

// const testJwtOperation = async () => {
//     let data = {foo: "bar"}
//     let token = jwtOperation.encrypt(data);
//     let dataAfter = jwtOperation.decrypt(token);

//     let foo = "bar";
// } 

// testJwtOperation();