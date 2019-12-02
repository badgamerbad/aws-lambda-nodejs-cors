const allowedOrigins = [`http://${process.env.APP_DOMAIN}`, `https://${process.env.APP_DOMAIN}`];

const cryptOperations = require("./utils/cryptOperation");

const authenticate = {
	checkIncomingRequest: async (event) => {
		// Retrieve the request, more details about the event variable later
		const headers = event.headers;
		const origin = headers.origin || headers.Origin;

		const requestPayload = event.body || event.query;
		const body = requestPayload ? JSON.parse(requestPayload) : {};
		
		let statusCode = 403, isValid = false;

		// Check for malicious request
		if (!allowedOrigins.includes(origin)) {
			body.errorMessage = `${origin} is not an allowed origin.`;
		}
		else {
			const cookie = headers["Cookie"];
			body.errorMessage = `Invalid Cookie`;
			if(cookie && cookie.indexOf("csrf_token") > -1) {
				const csrfToken = cookie.replace("csrf_token=", "");
				const decryptedValue = await cryptOperations.decrypt(csrfToken);
				if(typeof decryptedValue === "string") {
					isValid = true;
					statusCode = 200;
					body = { access_token: decryptedValue };
				}
				else {
					body.errorMessage = decryptedValue.message;
				}
			}
		}

		const responseHeaders = generateResponseHeaders();

		return { isValid, statusCode, responseHeaders, body }
	},
}

const generateResponseHeaders = async () => {
	const responseHeaders = {
		"Access-Control-Allow-Origin": `http://${process.env.APP_DOMAIN}`,
		"Access-Control-Allow-Credentials": true,
	};

	if(request.isValid) {
		// encrypt the github access token and send it as a csrf token
		// which acts like a stateless csrf token (Encryption based Token Pattern)
		const csrfToken = await cryptOperations.encrypt(request.body.access_token);

		let now = new Date();
		now.setHours(now.getHours() + 1);
		const cookieExpires = now.toUTCString();
		responseHeaders["Set-Cookie"] = `csrf_token=${csrfToken}; Max-Age=86400; Path=/; Expires=${cookieExpires}; HttpOnly`;
	}
}

module.exports = authenticate;