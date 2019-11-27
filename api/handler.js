"use strict";
const util = require("util");

let request = require("request");
request = util.promisify(request);

// Imports the Google Cloud client library
const { Storage } = require("@google-cloud/storage");
const Firestore = require('@google-cloud/firestore');

// Creates a client
const storage = new Storage();

const db = new Firestore({
  projectId: process.env.PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const cryptOperation = require("./cryptOperation");

const githubOauthConfig = {
  clientId: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  redirectUri: `http://${process.env.APP_DOMAIN}/`,
  allowedOrigins: [`http://${process.env.APP_DOMAIN}`, `https://${process.env.APP_DOMAIN}`],
  githubGetAccessTokenUrl: "https://github.com/login/oauth/access_token",
  githubGetUserDataUrl: "https://api.github.com/user",
};

// Set the configuration for your app
const fireBaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DB_URL,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
};

exports.githubAccessTokenGenerator = async (event, context) => {
  // Retrieve the request, more details about the event variable later
  const headers = event.headers;
  const body = JSON.parse(event.body);
  const origin = headers.origin || headers.Origin;

  // Check for malicious request
  if (!githubOauthConfig.allowedOrigins.includes(origin)) {
    body.message = `${origin} is not an allowed origin.`;
    return {
      "statusCode": 500,
      "headers": {
        "Access-Control-Allow-Origin": `http://${process.env.APP_DOMAIN}`,
        "Access-Control-Allow-Credentials": true,
      },
      "body": JSON.stringify({body, headers}),
      "isBase64Encoded": false
    };
  }

  const githubGetAccessTokenOptions = {
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      code: body.code,
      client_id: githubOauthConfig.clientId,
      client_secret: githubOauthConfig.clientSecret,
      redirect_uri: githubOauthConfig.redirectUri,
      state: body.state,
    }),
  };

  let statusCode, responseData, responseHeaders;
  responseHeaders = {
    "Access-Control-Allow-Origin": `http://${process.env.APP_DOMAIN}`,
    "Access-Control-Allow-Credentials": true,
  };
  // Request to GitHub with the given code
  const getGithubAccessTokenResponse = await request(githubOauthConfig.githubGetAccessTokenUrl, githubGetAccessTokenOptions);
  // if its a get access token error, like the network failure, authentication error
  if(getGithubAccessTokenResponse.error) {
    statusCode = 500;
    responseData = getGithubAccessTokenResponse;
  }
  else {
    let parseGetGithubAccessTokenResponseBody = JSON.parse(getGithubAccessTokenResponse.body);
    // if github api throws errro, example a bad_verification_code error
    if(parseGetGithubAccessTokenResponseBody.error) {
      statusCode = 500;
      responseData = { getGithubAccessTokenResponse };
    }
    // else fetch the github user details
    else {
      const fetchGithubUsersOptions = {
        "headers": {
          "Authorization": `token ${parseGetGithubAccessTokenResponseBody.access_token}`,
          "User-Agent": "PostmanRuntime/7.19.0",
        }
      };
      const fetchGithubUsersData = await request(githubOauthConfig.githubGetUserDataUrl, fetchGithubUsersOptions);
      // handle the get github user data error
      if (fetchGithubUsersData.statusCode !== 200) {
        statusCode = 500 || fetchGithubUsersData.statusCode;
        responseData = { getGithubAccessTokenResponse, fetchGithubUsersData };
      }
      else {
        try {
          let parseFetchGithubUsersDataBody = JSON.parse(fetchGithubUsersData.body);
          const firebaseDatabaseRef = await firebaseDatabase
            .ref(`/users/${parseFetchGithubUsersDataBody.id}`)
            .set(parseGetGithubAccessTokenResponseBody.access_token);

          // its success, if promise is resolved to undefined
          if (!firebaseDatabaseRef) {
            statusCode = 200;
            responseData = parseFetchGithubUsersDataBody;

            // generate stateless csrf token (Encryption based Token Pattern)
            let csrfToken = cryptOperation.encrypt(parseGetGithubAccessTokenResponseBody.access_token);

            let now = new Date();
            now.setHours(now.getHours() + 1);
            let cookieExpires = now.toUTCString();
            responseHeaders["Set-Cookie"] = `csrf_token=${csrfToken}; Max-Age=86400; Path=/; Expires=${cookieExpires}; HttpOnly`;
          }
        }
        catch (error) {
          statusCode = 500;
          responseData = error;
        }
      }
    }
  }
  
  return {
    "statusCode": statusCode,
    "headers": responseHeaders,
    "body": JSON.stringify(responseData),
    "isBase64Encoded": false
  };
};

exports.getSignedUrlForStorage = async (event, context) => {
  // check the csrf token

  // if okay then allow upload 

  // else retuan an error

  let docRef = db.collection('users').doc('alovelace');

  let setAda = docRef.set({
    first: 'Ada',
    last: 'Lovelace',
    born: 1815
  });

  console.log(setAda);

  const bucketName = fireBaseConfig.storageBucket;
  const filename = 'file.txt';

  const options = {
    version: 'v4',
    action: 'write',
    expires: Date.now() + 60 * 60 * 8 * 1000, // 8 hours
    contentType: 'application/octet-stream',
  };
  
  // Get a v4 signed URL for uploading file
  const [url] = await storage
    .bucket(bucketName)
    .file(filename)
    .getSignedUrl(options);

  console.log(url);
}