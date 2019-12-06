"use strict";

// authentication utils
const authenticate = require("./authenticate");

// data factories
const githubApi = require("./factory/githubFactory");
const gcpApi = require("./factory/gcpFactory");

exports.githubUserLogin = async (event, context) => {
  const request = authenticate.normalizeRequest(event);
  let statusCode = 500, responseData;
  
  // check if error while forming the request
  if(request.error) {
    statusCode = request.error.statusCode; 
    responseData = request;
  }
  // exchange the access code for access token
  // and fetch the github user details
  else {
    
  }
  
  return {
    "statusCode": statusCode,
    "headers": authenticate.getResponseHeaders(),
    "body": JSON.stringify(responseData),
    "isBase64Encoded": false
  };
};

exports.getSignedUrlForStorage = async (event, context) => {
  const request = authenticate.normalizeRequest(event);
  let statusCode = 500, responseData;

  // check if error while forming the request
  if(request.error) {
    statusCode = request.error.statusCode; 
    responseData = request;
  }
  // get the signed url from 
  // the gcp getSignedUrl function
  else {
    
  }

  return {
    "statusCode": statusCode,
    "headers": authenticate.getResponseHeaders(),
    "body": JSON.stringify(responseData),
    "isBase64Encoded": false
  };
}