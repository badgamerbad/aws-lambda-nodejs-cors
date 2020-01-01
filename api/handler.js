"use strict";

// authentication utils
const authenticate = require("./authenticate");

// data factories
const githubFactory = require("./factory/githubFactory");
const gcpFactory = require("./factory/gcpFactory");
const clarifaiFactory = require("./factory/clarifaiFactory");

exports.githubUserLogin = async (event, context) => {
  const requestBody = await authenticate.normalizeRequest(event);
  let responseStatusCode = 500, responseBody, responseHeaders;
  
  // check if error while forming the request body
  if(requestBody.error) {
    responseStatusCode = requestBody.error.statusCode;
    responseHeaders = await authenticate.getResponseHeaders();
    responseBody = JSON.stringify(requestBody);
  }
  // exchange the access code for access token
  // and fetch the github user details
  else {
    let accessData = await githubFactory.getGithubAccessToken(requestBody.body);
    if(accessData.error) {
      responseStatusCode = accessData.error.statusCode;
      responseHeaders = await authenticate.getResponseHeaders();
      responseBody = accessData.error.message;
    }
    else {
      let getUser = await githubFactory.getUser(accessData.accessToken);
      if(getUser.error) {
        responseStatusCode = getUser.error.statusCode;
        responseHeaders = await authenticate.getResponseHeaders();
        responseBody = getUser.error.message;
      }
      else {
        responseHeaders = await authenticate.getResponseHeaders(accessData.accessToken, getUser.userData.id);
        
        let getFilesForUser = await gcpFactory.getFilesForUser(getUser.userData.id);
        if(getFilesForUser.error) {
          responseStatusCode = getFilesForUser.error.statusCode;
          responseBody = getFilesForUser.error.message;
        }
        else {
          getUser.userData.filesList = getFilesForUser.files;

          responseStatusCode = 200;
          responseBody = JSON.stringify(getUser.userData);
        }
      }
    }
  }
  
  return {
    "statusCode": responseStatusCode,
    "headers": responseHeaders,
    "body": responseBody,
    "isBase64Encoded": false
  };
};

exports.getUserData = async (event, context) => {
  const requestBody = await authenticate.normalizeRequest(event);
  let responseStatusCode = 500, responseBody, responseHeaders;
  
  // check if error while forming the request body
  if(requestBody.error) {
    responseStatusCode = requestBody.error.statusCode;
    responseHeaders = await authenticate.getResponseHeaders();
    responseBody = JSON.stringify(requestBody);
  }
  // decrypt the csrf token and retrieve access token
  // and fetch the github user details
  else {
    let decryptCsrfToken = await authenticate.getAccessDataFromCsrfToken(requestBody.headers);
    if(decryptCsrfToken.error) {
      responseStatusCode = decryptCsrfToken.error.statusCode;
      responseHeaders = await authenticate.getResponseHeaders();
      responseBody = decryptCsrfToken.error.message;
    }
    else {
      responseHeaders = await authenticate.getResponseHeaders(decryptCsrfToken.accessData.accessToken, decryptCsrfToken.accessData.userId);
      let getUser = await githubFactory.getUser(decryptCsrfToken.accessData.accessToken);
      if(getUser.error) {
        responseStatusCode = getUser.error.statusCode;
        responseBody = getUser.error.message;
      }
      else {
        let getFilesForUser = await gcpFactory.getFilesForUser(getUser.userData.id);
        if(getFilesForUser.error) {
          responseStatusCode = getFilesForUser.error.statusCode;
          responseBody = getFilesForUser.error.message;
        }
        else {
          getUser.userData.filesList = getFilesForUser.files;

          responseStatusCode = 200;
          responseBody = JSON.stringify(getUser.userData);
        }
      }
    }
  }
  
  return {
    "statusCode": responseStatusCode,
    "headers": responseHeaders,
    "body": responseBody,
    "isBase64Encoded": false
  };
};

exports.getSignedUrlForStorage = async (event, context) => {
  const requestBody = await authenticate.normalizeRequest(event);
  let responseStatusCode = 500, responseBody, responseHeaders;

  // check if error while forming the request body
  if(requestBody.error) {
    responseStatusCode = requestBody.error.statusCode;
    responseHeaders = await authenticate.getResponseHeaders();
    responseBody = JSON.stringify(requestBody);
  }
  // get the access token from CSRF token
  // and after validating it,
  // generate the signed url
  else {
    let decryptCsrfToken = await authenticate.getAccessDataFromCsrfToken(requestBody.headers);
    if(decryptCsrfToken.error) {
      responseStatusCode = decryptCsrfToken.error.statusCode;
      responseHeaders = await authenticate.getResponseHeaders();
      responseBody = decryptCsrfToken.error.message;
    }
    else {
      responseHeaders = await authenticate.getResponseHeaders(decryptCsrfToken.accessData.accessToken, decryptCsrfToken.accessData.userId);
      const getSignedUrlParam = {
        userId: decryptCsrfToken.accessData.userId,
        fileType: requestBody.body.fileType,
      }
      const getSignedUrlData = await gcpFactory.getSignedUrlWrite(getSignedUrlParam);
      if(getSignedUrlData.error) {
        responseStatusCode = getSignedUrlData.error.statusCode;
        responseBody = getSignedUrlData.error.message;
      }
      else {
        responseStatusCode = 200;
        responseBody = JSON.stringify(getSignedUrlData);
      }
    }
  }

  return {
    "statusCode": responseStatusCode,
    "headers": responseHeaders,
    "body": responseBody,
    "isBase64Encoded": false
  };
}

exports.getImageWithClarifaiIngredients = async (event, context) => {
  const requestBody = await authenticate.normalizeRequest(event);
  let responseStatusCode = 500, responseBody, responseHeaders;
  
  // check if error while forming the request body
  if(requestBody.error) {
    responseStatusCode = requestBody.error.statusCode;
    responseHeaders = await authenticate.getResponseHeaders();
    responseBody = JSON.stringify(requestBody);
  }
  // decrypt the csrf token and retrieve access token
  // and fetch the github user details
  else {
    let decryptCsrfToken = await authenticate.getAccessDataFromCsrfToken(requestBody.headers);
    if(decryptCsrfToken.error) {
      responseStatusCode = decryptCsrfToken.error.statusCode;
      responseHeaders = await authenticate.getResponseHeaders();
      responseBody = decryptCsrfToken.error.message;
    }
    else {
      responseHeaders = await authenticate.getResponseHeaders(decryptCsrfToken.accessData.accessToken, decryptCsrfToken.accessData.userId);
      let getUser = await githubFactory.getUser(decryptCsrfToken.accessData.accessToken);
      if(getUser.error) {
        responseStatusCode = getUser.error.statusCode;
        responseBody = getUser.error.message;
      }
      else {
        let getSignedUrlData = await gcpFactory.getSignedUrlForFile(getUser.userData.id, requestBody.body.fileName);
        if(getSignedUrlData.error) {
          responseStatusCode = getSignedUrlData.error.statusCode;
          responseBody = getSignedUrlData.error.message;
        }
        else {
          let clarifaiData = await clarifaiFactory.getIngredients(getSignedUrlData.url);
          if(clarifaiData.error) {
            responseStatusCode = clarifaiData.error.statusCode;
            responseBody = clarifaiData.error.message;
          }
          else {
            responseStatusCode = 200;
            responseBody = JSON.stringify({url: getSignedUrlData.url, ingredients: clarifaiData.ingredients});
          }
        }
      }
    }
  }
  
  return {
    "statusCode": responseStatusCode,
    "headers": responseHeaders,
    "body": responseBody,
    "isBase64Encoded": false
  };
};