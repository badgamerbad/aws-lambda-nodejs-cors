"use strict";
const util = require("util");

let request = require("request");
request = util.promisify(request);

// for generating unique file name
const uuid = require("uuid/v1");

// Imports the Google Cloud client library
const { Storage } = require("@google-cloud/storage");

const authenticate = require("./authenticate");

// Creates a client
const storage = new Storage({
  projectId: process.env.PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const githubOauthConfig = {
  clientId: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  redirectUri: `http://${process.env.APP_DOMAIN}/`,
  githubGetAccessTokenUrl: "https://github.com/login/oauth/access_token",
  githubGetUserDataUrl: "https://api.github.com/user",
};

exports.githubAccessTokenGenerator = async (event, context) => {
  const request = authenticate.checkIncomingRequest(event);
  let statusCode, responseData;
  if(request.isValidSession) {
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
    // Request to GitHub with the given code
    const getGithubAccessTokenResponse = await request(githubOauthConfig.githubGetAccessTokenUrl, githubGetAccessTokenOptions);
    
    // if its a get access token error, like the network failure, authentication error
    if(getGithubAccessTokenResponse.error) {
      statusCode = 500;
      responseData = getGithubAccessTokenResponse;
    }
    else {
      let parseGetGithubAccessTokenResponseBody = JSON.parse(getGithubAccessTokenResponse.body);
      statusCode = 200;
      // if github api throws errro, example a bad_verification_code error
      if(parseGetGithubAccessTokenResponseBody.error) {
        statusCode = 500;
      }
      responseData = getGithubAccessTokenResponse;
    }
  }
  else {
    statusCode = request.statusCode; 
    responseData = request;
  }
  
  return {
    "statusCode": statusCode,
    "headers": authenticate.generateHeaders(request.headers),
    "body": JSON.stringify(responseData),
    "isBase64Encoded": false
  };
};

exports.getGithubUserData = async (event, context) => {
  const request = authenticate.checkIncomingRequest(event);
  let statusCode, responseData;
  if(request.isValidSession) {
    const fetchGithubUsersOptions = {
      "headers": {
        "Authorization": `token ${request.access_token}`,
        "User-Agent": "PostmanRuntime/7.19.0",
      }
    };
    const fetchGithubUsersData = await request(githubOauthConfig.githubGetUserDataUrl, fetchGithubUsersOptions);
    // handle the get github user data error
    if (fetchGithubUsersData.statusCode !== 200) {
      statusCode = 500 || fetchGithubUsersData.statusCode;
      responseData = fetchGithubUsersData;
    }
    else {
      statusCode = 200;
      responseData = JSON.parse(fetchGithubUsersData.body);
    }
  }
  else {
    statusCode = request.statusCode; 
    responseData = request;
  }

  return {
    "statusCode": statusCode,
    "headers": authenticate.generateHeaders(request.headers),
    "body": JSON.stringify(responseData),
    "isBase64Encoded": false
  };
};

exports.getSignedUrlForStorage = async (event, context) => {
  const request = authenticate.checkIncomingRequest(event);
  let statusCode, responseData;
  if(request.isValidSession) {
    const bucketName = process.env.BUCKET_NAME;
    const filename = `${uuid()}.${request.body.fileType.replace(/image\//g, "")}`;

    const gcpSignedUrlOptions = {
      version: 'v4',
      action: 'write',
      expires: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
      contentType: request.body.fileType,
    };
    
    // Get a v4 signed URL for uploading file
    const [url] = await storage
      .bucket(bucketName)
      .file(filename)
      .getSignedUrl(gcpSignedUrlOptions);

    responseData = { url };
  }
  else {
    statusCode = request.statusCode; 
    responseData = request;
  }

  return {
    "statusCode": statusCode,
    "headers": authenticate.generateHeaders(request.headers),
    "body": JSON.stringify(responseData),
    "isBase64Encoded": false
  };
}