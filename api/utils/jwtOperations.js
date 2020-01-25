const jwt = require('jsonwebtoken');

const secretKey = process.env.SECRET_KEY;

const jwtOperation = {
	encrypt: data => {
		var token = jwt.sign(data, secretKey);
		return token;
	},
	decrypt: jwtFromReq => {
		// handle the error in case of a mismatching JWT signature
		var data = jwt.verify(jwtFromReq, secretKey);
		return data;
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