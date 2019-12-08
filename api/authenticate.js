const allowedOrigins = [`http://${process.env.APP_DOMAIN}`, `https://${process.env.APP_DOMAIN}`];

const cryptOperations = require("./utils/cryptOperation");

const authenticate = {
	/**
	 * @description normalize the headers, body
	 * @argument event
	 * @returns
	 * object {headers, body, error}
	 */
	normalizeRequest: async event => {
		// Retrieve the request payload in the AWS lambda event
		const headers = event.headers;
		const origin = headers.origin || headers.Origin;

		const body = event.body ? JSON.parse(event.body) : event.queryStringParameters ? event.queryStringParameters : {};

		let error;
		if (!allowedOrigins.includes(origin)) {
			error = {
				statusCode: 403,
				message: `${origin} is not an allowed origin.`,
			}
		}

		return {headers, body, error};
	},
	/**
	 * @description verify the incoming request for CSRF
	 * @argument event.headers
	 * @returns 
	 * object {accessData, error}
	 * accessData = {accessToken, userId}
	 */
	getAccessDataFromCsrfToken: async headers => {
		let accessData, error;

		// validate the cookie
		const cookie = headers["Cookie"];
		if (cookie && cookie.indexOf("csrf_token") > -1) {
			const csrfToken = cookie.replace("csrf_token=", "");
			const decryptedValue = await cryptOperations.decrypt(csrfToken);
			if (typeof decryptedValue === "string") {
				accessData = JSON.parse(decryptedValue);
				let now = new Date();
				if(!accessData.timeStamp || accessData.timeStamp < now.getTime()) {
					error = {
						statusCode: 403,
						message: "The CSRF token is expired or invalid",
					}
				}
			}
			else {
				error = {
					statusCode: 403,
					message: decryptedValue.message,
				}
			}
		}
		else {
			error = {
				statusCode: 403,
				message: "Invalid Cookie",
			}
		}

		return {accessData, error}
	},
	/**
	 * @description generate the headers for the response
	 * @argument accessToken, userId
	 * @returns 
	 * object {
	 *   "Access-Control-Allow-Origin"
	 *   "Access-Control-Allow-Credentials"
	 *   "Set-Cookie"?
	 * }
	 */
	getResponseHeaders: async (accessToken, userId) => {
		// CORS headers
		let responseHeaders = {
			"Access-Control-Allow-Origin": `http://${process.env.APP_DOMAIN}`,
			"Access-Control-Allow-Credentials": true,
		};

		if (accessToken && userId) {
			// encrypt the github access token, userId and timestamp (prevent replay attack)
			// and send it as a csrf token
			// which acts like a stateless csrf token (Encryption based Token Pattern)
			let now = new Date();

			// making the CSRF token valid for 1 hour
			const timeStamp = now.setHours(now.getHours() + 1);

			const csrfToken = await cryptOperations.encrypt(JSON.stringify({ accessToken, userId, timeStamp }));

			now = new Date();
			now.setHours(now.getHours() + 1);
			const cookieExpires = now.toUTCString();
			responseHeaders["Set-Cookie"] = `csrf_token=${csrfToken}; Max-Age=86400; Path=/; Expires=${cookieExpires}; HttpOnly`;
		}

		return responseHeaders;
	}
}

module.exports = authenticate;