"use strict";

const util = require("util");

let request = require("request");
request = util.promisify(request);

const githubOauthConfig = {
	clientId: process.env.GITHUB_CLIENT_ID,
	clientSecret: process.env.GITHUB_CLIENT_SECRET,
	redirectUri: `http://${process.env.APP_DOMAIN}/`,
	githubGetAccessTokenUrl: "https://github.com/login/oauth/access_token",
	githubGetUserDataUrl: "https://api.github.com/user",
};

const githubApi = {
	githubGetAccessToken: async request => {
		let accessToken, error;

		const githubGetAccessTokenOptions = {
			headers: {
				"Content-Type": "application/json",
				"Accept": "application/json",
			},
			body: JSON.stringify({
				code: request.code,
				client_id: githubOauthConfig.clientId,
				client_secret: githubOauthConfig.clientSecret,
				redirect_uri: githubOauthConfig.redirectUri,
				state: request.state,
			}),
		};
		// Request to GitHub with the given code
		const getGithubAccessTokenResponse = await request(githubOauthConfig.githubGetAccessTokenUrl, githubGetAccessTokenOptions);
		const parseGetGithubAccessTokenResponseBody = JSON.parse(getGithubAccessTokenResponse.body);

		// if github api throws error, example a bad_verification_code error
		if (parseGetGithubAccessTokenResponseBody.error) {
			error = {
				statusCode: 401,
				message: parseGetGithubAccessTokenResponseBody.error,
			}
		}
		else {
			accessToken = parseGetGithubAccessTokenResponseBody.access_token;
		}

		return { accessToken, error }
	},
	getUserDetails: async request => {
		let userData, error;

		const fetchGithubUsersOptions = {
      "headers": {
        "Authorization": `token ${request.access_token}`,
        "User-Agent": "PostmanRuntime/7.19.0",
      }
    };
    const fetchGithubUsersData = await request(githubOauthConfig.githubGetUserDataUrl, fetchGithubUsersOptions);
		
		// handle the get github user data error
    if (fetchGithubUsersData.statusCode !== 200 || fetchGithubUsersData.body.message) {
			error = {
				statusCode: 401,
				message: fetchGithubUsersData.message,
			}
    }
    else {
      userData = JSON.parse(fetchGithubUsersData.body);
		}
		
		return { userData, error }
	}
}

module.exports = githubApi;