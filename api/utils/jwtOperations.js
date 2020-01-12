const jwt = require('jsonwebtoken');

const secretKey = process.env.SECRET_KEY;

const jwtOperation = {
    encrypt: async data => {
        var token = jwt.sign(data, secretKey);
        return token;
    },
    decrypt: async (jwtFromReq) => {
        var data = jwt.verify(jwtFromReq, secretKey);
        return data;
    },
}

// module.exports = jwtOperation;

const someFunction = async () => {
    let data = {foo: "bar"}
    let token = await jwtOperation.encrypt(data);
    let dataAfter = await jwtOperation.decrypt(token);

    let foo = "bar";
} 

someFunction();