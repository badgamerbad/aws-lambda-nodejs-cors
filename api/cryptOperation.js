"use strict";
const _util = require("util");

// Nodejs encryption with CTR
const _crypto = require('crypto');
const algorithm = 'aes-256-gcm';

_crypto.randomBytes = _util.promisify(_crypto.randomBytes);

const encrypt = async githubAccessToken => {
    const randomBuffer = await _crypto.randomBytes(48);
    const randomToken = randomBuffer.toString('hex');

    console.log("randomToken -------------------------------------------")
    console.log(randomToken)

    // random initialization vector
    const iv = _crypto.randomBytes(16);

    // random salt
    const salt = _crypto.randomBytes(64);

    // derive encryption key: 32 byte key length
    // in assumption the masterkey is a cryptographic and NOT a password there is no need for
    // a large number of iterations. It may can replaced by HKDF
    // the value of 2145 is randomly chosen!
    const key = _crypto.pbkdf2Sync(githubAccessToken, salt, 2145, 32, 'sha512');

    // AES 256 GCM Mode
    const cipher = _crypto.createCipheriv(algorithm, key, iv);

    // encrypt the given text
    const encrypted = cipher.update(randomToken);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString('hex');
}
   
const decrypt = async (token, githubAccessToken) => {
    let encryptedText = Buffer.from(token, 'hex');
    let decipher = _crypto.createDecipheriv(algorithm, Buffer.from(githubAccessToken.substr(0, 32)), iv);
    let decrypted = decipher.update(encryptedText) + decipher.final();
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