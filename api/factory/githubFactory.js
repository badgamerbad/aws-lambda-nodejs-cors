"use strict";

const util = require("util");

let _request = require("request");
_request = util.promisify(_request);

const redirectUri = `${process.env.HTTP_TYPE}://${process.env.APP_DOMAIN}`;

const githubOauthConfig = {
	clientId: process.env.GITHUB_CLIENT_ID,
	clientSecret: process.env.GITHUB_CLIENT_SECRET,
	redirectUri: redirectUri,
	githubGetAccessTokenUrl: "https://github.com/login/oauth/access_token",
	githubGetUserDataUrl: "https://api.github.com/user",
};

const githubFactory = {
	getGithubAccessToken: async requestBody => {
		let accessToken, error;

		const githubGetAccessTokenOptions = {
			headers: {
				"Content-Type": "application/json",
				"Accept": "application/json",
			},
			body: JSON.stringify({
				code: requestBody.code,
				client_id: githubOauthConfig.clientId,
				client_secret: githubOauthConfig.clientSecret,
				redirect_uri: githubOauthConfig.redirectUri,
				state: requestBody.state,
			}),
		};
		// Request to GitHub with the given code
		const getGithubAccessData = await _request(githubOauthConfig.githubGetAccessTokenUrl, githubGetAccessTokenOptions);

		if(getGithubAccessData.statusCode !== 200) {
			error = {
				statusCode: getGithubAccessData.statusCode,
				message: getGithubAccessData.statusMessage,
			}
		}
		else {
			const parseGetGithubAccessData = JSON.parse(getGithubAccessData.body);

			// if github api throws error, example a bad_verification_code error
			if (parseGetGithubAccessData.error) {
				error = {
					statusCode: 401,
					message: parseGetGithubAccessData.error,
				}
			}
			else {
				accessToken = parseGetGithubAccessData.access_token;
			}
		}
		
		return { accessToken, error }
	},
	getUser: async accessToken => {
		let userData, error;

		const fetchGithubUserOptions = {
      "headers": {
        "Authorization": `token ${accessToken}`,
        "User-Agent": "PostmanRuntime/7.19.0",
      }
    };
    const fetchGithubUserData = await _request(githubOauthConfig.githubGetUserDataUrl, fetchGithubUserOptions);
		
		// handle the get github user data error
    if (fetchGithubUserData.statusCode !== 200) {
			error = {
				statusCode: fetchGithubUserData.statusCode,
				message: fetchGithubUserData.statusMessage,
			}
    }
    else {
      userData = JSON.parse(fetchGithubUserData.body);
		}
		
		return { userData, error }
	}
}

module.exports = githubFactory;