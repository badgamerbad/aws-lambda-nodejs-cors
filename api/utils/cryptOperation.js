"use strict";

// AES Encryption/Decryption with AES-256-GCM using random Initialization Vector + Salt
// ----------------------------------------------------------------------------------------
// the encrypted datablock is base64 encoded for easy data exchange. 
// if you have the option to store data binary save consider to remove the encoding to reduce storage size
// ----------------------------------------------------------------------------------------
// format of encrypted data - used by this example. not an official format
//
// +--------------------+-----------------------+----------------+----------------+
// | SALT               | Initialization Vector | Auth Tag       | Payload        |
// | Used to derive key | AES GCM XOR Init      | Data Integrity | Encrypted Data |
// | 64 Bytes, random   | 16 Bytes, random      | 16 Bytes       | (N-96) Bytes   |
// +--------------------+-----------------------+----------------+----------------+
//
// ----------------------------------------------------------------------------------------
// Input/Output Vars
//
// MASTERKEY: the key used for encryption/decryption. 
//            it has to be cryptographic safe - this means randomBytes or derived by pbkdf2 (for example)
// TEXT:      data (utf8 string) which should be encoded. modify the code to use Buffer for binary data!
// ENCDATA:   encrypted data as base64 string (format mentioned on top)

// load the build-in crypto functions
const _crypto = require('crypto');

const _util = require("util");

const algorithm = 'aes-256-gcm';

_crypto.randomBytes = _util.promisify(_crypto.randomBytes);

const secretKey = process.env.SECRET_KEY;

const encrypt = async githubAccessToken => {
	try {
		// random initialization vector
		const iv = await _crypto.randomBytes(16);

		// random salt
		const salt = await _crypto.randomBytes(64);

		// derive encryption key: 32 byte key length
		// in assumption the masterkey is a cryptographic and NOT a password there is no need for
		// a large number of iterations. It may can replaced by HKDF
		// the value of 2145 is randomly chosen!
		const key = _crypto.pbkdf2Sync(secretKey, salt, 2145, 32, 'sha512');

		// AES 256 GCM Mode
		const cipher = _crypto.createCipheriv(algorithm, key, iv);

		// encrypt the given text
		const encrypted = Buffer.concat([cipher.update(githubAccessToken, "utf8"), cipher.final()]);

		// extract the auth tag
		const tag = cipher.getAuthTag();

		// generate output which is the CSRF Token
		return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
	}
	catch (exception) {
		return exception;
	}
}

const decrypt = async csrfToken => {
	try {
		// base64 decoding
		const bData = Buffer.from(csrfToken, 'base64');

		// convert data to buffers
		const salt = bData.slice(0, 64);
		const iv = bData.slice(64, 80);
		const tag = bData.slice(80, 96);
		const text = bData.slice(96);

		// derive key using; 32 byte key length
		const key = _crypto.pbkdf2Sync(secretKey, salt, 2145, 32, 'sha512');

		// AES 256 GCM Mode
		const decipher = _crypto.createDecipheriv('aes-256-gcm', key, iv);
		decipher.setAuthTag(tag);

		// encrypt the given text
		const decrypted = decipher.update(text, 'binary', 'utf8') + decipher.final('utf8');

		return decrypted;
	}
	catch (exception) {
		return exception;
	}
}

module.exports = { encrypt, decrypt };