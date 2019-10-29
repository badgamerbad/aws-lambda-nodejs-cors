"use strict";
const util = require("util");

let request = require("request");
request = util.promisify(request);

// const firebase = require("firebase");
// require("firebase/database");

const githubOauthConfig = {
  clientId: "Iv1.c6778b1c26a766bd",
  clientSecret: "24ee9c042bafc74699ff49270b0403da31e7ce30",
  redirectUri: "http://localhost:8000/",
  allowedOrigins: ["http://localhost:8000", "https://localhost:8000"],
  githubGetAccessTokenUrl: "https://github.com/login/oauth/access_token",
  githubGetUserDataUrl: "https://api.github.com/user",
};

// Set the configuration for your app
// const fireBaseConfig = {
//   apiKey: "AIzaSyCT1vDFzdF8fv1aYEhU_pMH0HQNqGNFNls",
//   authDomain: "ingredofit.firebaseapp.com",
//   databaseURL: "https://ingredofit.firebaseio.com",
//   storageBucket: "ingredofit.appspot.com",
// };
// firebase.initializeApp(fireBaseConfig);

// initialize the firebase database
// const firebaseDatabase = firebase.database();

module.exports.githubAccessTokenGenerator = async (event, context, awsLambdaCallback) => {
  // Retrieve the request, more details about the event variable later
  const headers = event.headers;
  const body = JSON.parse(event.body);
  const origin = headers.origin || headers.Origin;

  // Check for malicious request
  if (!githubOauthConfig.allowedOrigins.includes(origin)) {
    body.message = `${origin} is not an allowed origin.`;
    awsLambdaCallback(null, {
      "statusCode": 500,
      "headers": {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      "body": JSON.stringify({body, headers}),
      "isBase64Encoded": false
    });
  }

  // const githubGetAccessTokenOptions = {
  //   headers: {
  //     "Content-Type": "application/json",
  //     "Accept": "application/json",
  //   },
  //   body: JSON.stringify({
  //     code: body.code,
  //     client_id: githubOauthConfig.clientId,
  //     client_secret: githubOauthConfig.clientSecret,
  //     redirect_uri: githubOauthConfig.redirectUri,
  //     state: body.state,
  //   }),
  // };

  // let statusCode, responseData;
  // // Request to GitHub with the given code
  // const getGithubAccessTokenResponse = await request(githubOauthConfig.githubGetAccessTokenUrl, githubGetAccessTokenOptions);
  // // if its a get access token error, like the network failure, authentication error
  // if(getGithubAccessTokenResponse.error) {
  //   statusCode = 500;
  //   responseData = getGithubAccessTokenResponse;
  // }
  // else {
  //   let parseGetGithubAccessTokenResponseBody = JSON.parse(getGithubAccessTokenResponse.body);
  //   // if github api throws errro, example a bad_verification_code error
  //   if(parseGetGithubAccessTokenResponseBody.error) {
  //     statusCode = 500;
  //     responseData = { getGithubAccessTokenResponse };
  //   }
  //   // else fetch the github user details
  //   else {
  //     const fetchGithubUsersOptions = {
  //       "headers": {
  //         "Authorization": `token ${parseGetGithubAccessTokenResponseBody.access_token}`,
  //         "User-Agent": "PostmanRuntime/7.19.0",
  //       }
  //     }
  //     const fetchGithubUsersData = await request(githubOauthConfig.githubGetUserDataUrl, fetchGithubUsersOptions);
  //     // handle the get github user data error
  //     if (fetchGithubUsersData.statusCode !== 200) {
  //       statusCode = 500 || fetchGithubUsersData.statusCode;
  //       responseData = { getGithubAccessTokenResponse, fetchGithubUsersData };
  //     }
  //     else {
  //       try {
  //         let parseFetchGithubUsersDataBody = JSON.parse(fetchGithubUsersData.body);
  //         const firebaseDatabaseRef = await firebaseDatabase
  //           .ref(`/users/${parseFetchGithubUsersDataBody.id}`)
  //           .set(parseGetGithubAccessTokenResponseBody.access_token);

  //         // its success, if promise is resolved to undefined
  //         if (!firebaseDatabaseRef) {
  //           statusCode = 200;
  //           responseData = parseGetGithubAccessTokenResponseBody;
  //           responseData.userData = parseFetchGithubUsersDataBody;
  //         }
  //       }
  //       catch (error) {
  //         statusCode = 500;
  //         responseData = error;
  //       }
  //     }
  //   }
  // }

  let statusCode = 200;
  let responseData = {foo: "bar"};
  awsLambdaCallback(
    null,
    {
      "statusCode": statusCode,
      "headers": {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      "body": JSON.stringify(responseData),
      "isBase64Encoded": false
    }
  );
};