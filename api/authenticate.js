const allowedOrigin = [`${process.env.HTTP_TYPE}://${process.env.APP_DOMAIN}`];

const cryptOperations = require("./utils/cryptOperation");
const jwtOperations = require("./utils/jwtOperations");

const authenticate = {
	/**
	 * @description normalize the headers, body
	 * @argument {event}
	 * @returns {headers, body, error}
	 */
	normalizeRequest: async event => {
		// Retrieve the request payload in the AWS lambda event
		const headers = event.headers;
		const origin = headers.origin || headers.Origin;

		const body = event.body ? JSON.parse(event.body) : event.queryStringParameters ? event.queryStringParameters : {};

		let error;
		if (!allowedOrigin.includes(origin)) {
			error = {
				statusCode: 403,
				message: `${origin} is not an allowed origin.`,
			}
		}

		return {headers, body, error};
	},
	/**
	 * @description verify the incoming request for CSRF
	 * @argument {event.headers}
	 * @returns {accessData: {accessToken, userId}, error} 
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
	 * @argument {accessToken, userId, logoutUser: boolean}
	 * @returns {
	 *   "Access-Control-Allow-Origin"
	 *   "Access-Control-Allow-Credentials"
	 *   "Set-Cookie"?
	 * }
	 */
	getResponseHeaders: async (accessToken, userId, logoutUser) => {
		// CORS headers
		let responseHeaders = {
			"Access-Control-Allow-Origin": allowedOrigin[0],
			"Access-Control-Allow-Credentials": true,
		};

		if (logoutUser) {
			responseHeaders["Set-Cookie"] = `csrf_token=none; Max-Age=86400; Path=/; HttpOnly`;
		}
		// in case the logoutUser is undefined or false
		else {
			if (accessToken && userId) {
				// encrypt the github access token, userId and timestamp (prevent replay attack)
				// and send it as a csrf token
				// which acts like a stateless csrf token (Encryption based Token Pattern)
				let now = new Date();
	
				// making the CSRF token valid for hour(s) in env CSRF_MAX_AGE_IN_HOURS
				const timeStamp = now.setHours(now.getHours() + parseInt(process.env.CSRF_MAX_AGE_IN_HOURS));
	
				const csrfToken = await cryptOperations.encrypt(JSON.stringify({ accessToken, userId, timeStamp }));
	
				now = new Date();
				now.setHours(now.getHours() + 1);
				const cookieExpires = now.toUTCString();
				responseHeaders["Set-Cookie"] = `csrf_token=${csrfToken}; Max-Age=86400; Path=/; Expires=${cookieExpires}; HttpOnly`;
			}
		}

		return responseHeaders;
	},
	/**
	 * @description generate an jwt of the data provided
	 * @returns {jwt}
	 */
	getEncodedJwt: async data => {
		return jwtOperations.encrypt(data);
	},
	/**
	 * @description generate an jwt of the data provided
	 * @returns {data}
	 */
	getDecodedJwt: async jwtFromReq => {
		return jwtOperations.decrypt(jwtFromReq);
	}
}

module.exports = authenticate;