const allowedOrigins = [`http://${process.env.APP_DOMAIN}`, `https://${process.env.APP_DOMAIN}`];

const cryptOperations = require("./utils/cryptOperation");

const authenticate = {
	checkIncomingRequest: async (event) => {
		// Retrieve the request, more details about the event variable later
		const headers = event.headers;
		const body = JSON.parse(event.body);
		const origin = headers.origin || headers.Origin;
		
		let statusCode = 403, isValidSession = false;

		// Check for malicious request
		if (!allowedOrigins.includes(origin)) {
			body.errorMessage = `${origin} is not an allowed origin.`;
		}
		else {
			const cookie = headers["Cookie"];
			body.errorMessage = `Invalid Cookie`;
			if(cookie && cookie.indexOf("csrf_token") > -1) {
				isValidSession = true;
				statusCode = 200;
				const csrfToken = cookie.replace("csrf_token=", "");
				body.access_token = cryptOperations.decrypt(csrfToken);
			}
		}

		return {
			isValidSession, statusCode, body, headers
		}
	},
	generateHeaders: () => {
		const responseHeaders = {
			"Access-Control-Allow-Origin": `http://${process.env.APP_DOMAIN}`,
			"Access-Control-Allow-Credentials": true,
		};

		// encrypt the github access token and send it as a csrf token
		// which acts like a stateless csrf token (Encryption based Token Pattern)
		const csrfToken = cryptOperations.encrypt();

		let now = new Date();
		now.setHours(now.getHours() + 1);
		const cookieExpires = now.toUTCString();
		responseHeaders["Set-Cookie"] = `csrf_token=${csrfToken}; Max-Age=86400; Path=/; Expires=${cookieExpires}; HttpOnly`;
	},
}

module.exports = authenticate;