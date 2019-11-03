"use strict";
const util = require("util");

// Nodejs encryption with CTR
const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const iv = crypto.randomBytes(16);

crypto.randomBytes = util.promisify(crypto.randomBytes);

const encrypt = async githubAccessToken => {
    const buffer = await crypto.randomBytes(48);
    const token = buffer.toString('hex');

    let cipher = crypto.createCipheriv(algorithm, githubAccessToken, iv);
    let encrypted = cipher.update(token);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString('hex');
}
   
const decrypt = async (token, githubAccessToken) => {
    let encryptedText = Buffer.from(token, 'hex');
    let decipher = crypto.createDecipheriv(algorithm, githubAccessToken, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

const encryptedToken = encrypt("57645173062d8e8faed8bc7a4b487c146989a8d5");
// const boolean = decrypt(encryptedToken, "57645173062d8e8faed8bc7a4b487c146989a8d5");