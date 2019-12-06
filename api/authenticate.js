const allowedOrigins = [`http://${process.env.APP_DOMAIN}`, `https://${process.env.APP_DOMAIN}`];

const cryptOperations = require("./utils/cryptOperation");

const authenticate = {
	normalizeRequest: async event => {
		// Retrieve the request payload in the AWS lambda event
		const headers = event.headers;
		const origin = headers.origin || headers.Origin;

		const requestPayload = event.body || event.query;
		const body = requestPayload ? JSON.parse(requestPayload) : {};

		let error;
		if (!allowedOrigins.includes(origin)) {
			error = {
				statusCode: 403,
				message: `${origin} is not an allowed origin.`,
			}
		}

		return { headers, body, error };
	},
	getAccessDataFromCsrfToken: async headers => {
		let accessData, error;

		// validate the cookie
		const cookie = headers["Cookie"];
		if (cookie && cookie.indexOf("csrf_token") > -1) {
			const csrfToken = cookie.replace("csrf_token=", "");
			const decryptedValue = await cryptOperations.decrypt(csrfToken);
			if (typeof decryptedValue === "string") {
				accessData = JSON.parse(decryptedValue);
			}
			else {
				error = {
					statusCode: 403,
					message: decryptedValue.message,
				}
			}
		}

		return { accessData, error }
	},
	getResponseHeaders: async (accessToken, userId) => {
		// CORS headers
		let responseHeaders = {
			"Access-Control-Allow-Origin": `http://${process.env.APP_DOMAIN}`,
			"Access-Control-Allow-Credentials": true,
		};

		if (accessToken && userId) {
			// encrypt the github access token and userId
			// and send it as a csrf token
			// which acts like a stateless csrf token (Encryption based Token Pattern)
			const csrfToken = await cryptOperations.encrypt(JSON.stringify({ accessToken: accessToken, userId: userId }));

			let now = new Date();
			now.setHours(now.getHours() + 1);
			const cookieExpires = now.toUTCString();
			responseHeaders["Set-Cookie"] = `csrf_token=${csrfToken}; Max-Age=86400; Path=/; Expires=${cookieExpires}; HttpOnly`;
		}

		return responseHeaders;
	}
}

module.exports = authenticate;