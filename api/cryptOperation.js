"use strict";
const util = require("util");

// Nodejs encryption with CTR
const crypto = require('crypto');
const algorithm = 'aes-256-gcm';
const iv = crypto.randomBytes(16);

crypto.randomBytes = util.promisify(crypto.randomBytes);

const encrypt = async githubAccessToken => {
    const buffer = await crypto.randomBytes(48);
    const token = buffer.toString('hex');
    console.log("token-------------------------------------------")
    console.log(token)
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(githubAccessToken.substr(0, 32)), iv);
    let encrypted = cipher.update(token);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString('hex');
}
   
const decrypt = async (token, githubAccessToken) => {
    let encryptedText = Buffer.from(token, 'hex');
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(githubAccessToken.substr(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

let encPromise = encrypt("57645173062d8e8faed8bc7a4b487c146989a8d5");
encPromise.then(encString =>{ 
    let decPromise = decrypt(encString, "57645173062d8e8faed8bc7a4b487c146989a8d5");
    decPromise.then(decToken => {
        console.log("decToken-------------------------------------------")
        console.log(decToken)
    })
    .catch(err => {
        console.log(err);
    })
})
.catch(error => {
    console.log(error);
});