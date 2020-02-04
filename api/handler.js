"use strict";

// authentication utils
const authenticate = require("./authenticate");

// data factories
const githubFactory = require("./factory/githubFactory");
const gcpFactory = require("./factory/gcpFactory");
const clarifaiFactory = require("./factory/clarifaiFactory");

/**
 * @description exchange the access code for access token and 
 * get the user data along with the list of files in the 
 * storage for the user
 * @argument {queryStringParameters.code}
 * @returns {userData, filesList}
 */
exports.githubUserLogin = async (event, context) => {
  let responseStatusCode = 500, responseBody, responseHeaders;

  try {
    const requestBody = await authenticate.normalizeRequest(event);

    // check if error while forming the request body
    if (requestBody.error) {
      responseStatusCode = requestBody.error.statusCode;
      responseHeaders = await authenticate.getResponseHeaders();
      responseBody = JSON.stringify(requestBody);
    }
    // exchange the access code for access token
    // and fetch the github user details
    else {
      let accessData = await githubFactory.getGithubAccessToken(requestBody.body);
      if (accessData.error) {
        responseStatusCode = accessData.error.statusCode;
        responseHeaders = await authenticate.getResponseHeaders();
        responseBody = accessData.error.message;
      }
      else {
        let getUser = await githubFactory.getUser(accessData.accessToken);
        if (getUser.error) {
          responseStatusCode = getUser.error.statusCode;
          responseHeaders = await authenticate.getResponseHeaders();
          responseBody = getUser.error.message;
        }
        else {
          responseHeaders = await authenticate.getResponseHeaders(accessData.accessToken, getUser.userData.id);

          let getFilesForUser = await gcpFactory.getFilesForUser(getUser.userData.id);
          if (getFilesForUser.error) {
            responseStatusCode = getFilesForUser.error.statusCode;
            responseBody = getFilesForUser.error.message;
          }
          else {
            getUser.userData.filesList = getFilesForUser.files;

            responseStatusCode = 200;
            responseBody = await authenticate.getEncodedJwt(getUser.userData);
          }
        }
      }
    }
  }
  catch (exception) {
    responseHeaders = responseHeaders ? responseHeaders : await authenticate.getResponseHeaders();
    responseStatusCode = 500;
    responseBody = JSON.stringify({error: exception.message, stack: exception.stack});
  }

  return {
    "statusCode": responseStatusCode,
    "headers": responseHeaders,
    "body": responseBody,
    "isBase64Encoded": false
  };
};
/**
 * @description get user data along with the list of files in the 
 * storage for the logged in user
 * @argument {header.csrf_token}
 * @returns {userData, filesList}
 */
exports.getUserData = async (event, context) => {
  let responseStatusCode = 500, responseBody, responseHeaders;

  try {
    const requestBody = await authenticate.normalizeRequest(event);

    // check if error while forming the request body
    if (requestBody.error) {
      responseStatusCode = requestBody.error.statusCode;
      responseHeaders = await authenticate.getResponseHeaders();
      responseBody = JSON.stringify(requestBody);
    }
    // decrypt the csrf token and retrieve access token
    // and fetch the github user details
    else {
      let decryptCsrfToken = await authenticate.getAccessDataFromCsrfToken(requestBody.headers);
      if (decryptCsrfToken.error) {
        responseStatusCode = decryptCsrfToken.error.statusCode;
        responseHeaders = await authenticate.getResponseHeaders();
        responseBody = decryptCsrfToken.error.message;
      }
      else {
        responseHeaders = await authenticate.getResponseHeaders(decryptCsrfToken.accessData.accessToken, decryptCsrfToken.accessData.userId);
        let getUser = await githubFactory.getUser(decryptCsrfToken.accessData.accessToken);
        if (getUser.error) {
          responseStatusCode = getUser.error.statusCode;
          responseBody = getUser.error.message;
        }
        else {
          let getFilesForUser = await gcpFactory.getFilesForUser(getUser.userData.id);
          if (getFilesForUser.error) {
            responseStatusCode = getFilesForUser.error.statusCode;
            responseBody = getFilesForUser.error.message;
          }
          else {
            getUser.userData.filesList = getFilesForUser.files;

            responseStatusCode = 200;
            responseBody = await authenticate.getEncodedJwt(getUser.userData);
          }
        }
      }
    }
  }
  catch (exception) {
    responseHeaders = responseHeaders ? responseHeaders : await authenticate.getResponseHeaders();
    responseStatusCode = 500;
    responseBody = JSON.stringify({error: exception.message, stack: exception.stack});
  }

  return {
    "statusCode": responseStatusCode,
    "headers": responseHeaders,
    "body": responseBody,
    "isBase64Encoded": false
  };
};
/**
 * @description get signed URL to upload the file directly into the storage
 * @argument {header.csrf_token, queryStringParameters.fileType}
 * @returns {pictureImageUploadingSignedUrl}
 */
exports.getSignedUrlForStorage = async (event, context) => {
  let responseStatusCode = 500, responseBody, responseHeaders;

  try {
    const requestBody = await authenticate.normalizeRequest(event);

    // check if error while forming the request body
    if (requestBody.error) {
      responseStatusCode = requestBody.error.statusCode;
      responseHeaders = await authenticate.getResponseHeaders();
      responseBody = JSON.stringify(requestBody);
    }
    // get the access token from CSRF token
    // and after validating it,
    // generate the signed url
    else {
      let decryptCsrfToken = await authenticate.getAccessDataFromCsrfToken(requestBody.headers);
      if (decryptCsrfToken.error) {
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
        if (getSignedUrlData.error) {
          responseStatusCode = getSignedUrlData.error.statusCode;
          responseBody = getSignedUrlData.error.message;
        }
        else {
          responseStatusCode = 200;
          responseBody = JSON.stringify(getSignedUrlData.uploadedFileData);
        }
      }
    }
  }
  catch (exception) {
    responseHeaders = responseHeaders ? responseHeaders : await authenticate.getResponseHeaders();
    responseStatusCode = 500;
    responseBody = JSON.stringify({error: exception.message, stack: exception.stack});
  }

  return {
    "statusCode": responseStatusCode,
    "headers": responseHeaders,
    "body": responseBody,
    "isBase64Encoded": false
  };
}
/**
 * @description get the signed URL for downloading the picture image file on the client side
 * along with its ingredients listing
 * @argument {header.csrf_token, queryStringParameters.fileName, userDataJwt}
 * @returns {pictureImageDownloadingSignedUrl, ingredientsListing}
 */
exports.getImageWithClarifaiIngredients = async (event, context) => {
  let responseStatusCode = 500, responseBody, responseHeaders;

  try {
    const requestBody = await authenticate.normalizeRequest(event);

    // check if error while forming the request body
    if (requestBody.error) {
      responseStatusCode = requestBody.error.statusCode;
      responseHeaders = await authenticate.getResponseHeaders();
      responseBody = JSON.stringify(requestBody);
    }
    // decrypt the csrf token and retrieve access token
    // and fetch the github user details
    else {
      let decryptCsrfToken = await authenticate.getAccessDataFromCsrfToken(requestBody.headers);
      if (decryptCsrfToken.error) {
        responseStatusCode = decryptCsrfToken.error.statusCode;
        responseHeaders = await authenticate.getResponseHeaders();
        responseBody = decryptCsrfToken.error.message;
      }
      else {
        let decodedJwtUserData = await authenticate.getDecodedJwt(requestBody.body.jwt);

        responseHeaders = await authenticate.getResponseHeaders(decryptCsrfToken.accessData.accessToken, decryptCsrfToken.accessData.userId);

        let getSignedUrlData = await gcpFactory.getSignedUrlForFile(decodedJwtUserData, requestBody.body.fileName);
        if (getSignedUrlData.error) {
          responseStatusCode = getSignedUrlData.error.statusCode;
          responseBody = getSignedUrlData.error.message;
        }
        else {
          let clarifaiData = await clarifaiFactory.getIngredients(getSignedUrlData.url);
          if (clarifaiData.error) {
            responseStatusCode = clarifaiData.error.statusCode;
            responseBody = clarifaiData.error.message;
          }
          else {
            responseStatusCode = 200;
            responseBody = JSON.stringify({ url: getSignedUrlData.url, ingredients: clarifaiData.ingredients });
          }
        }
      }
    }
  }
  catch (exception) {
    responseHeaders = responseHeaders ? responseHeaders : await authenticate.getResponseHeaders();
    responseStatusCode = 500;
    responseBody = JSON.stringify({error: exception.message, stack: exception.stack});
  }

  return {
    "statusCode": responseStatusCode,
    "headers": responseHeaders,
    "body": responseBody,
    "isBase64Encoded": false
  };
};
/**
 * @description delete the requested file from the storage
 * @argument {header.csrf_token, queryStringParameters.fileName, userDataJwt}
 * @returns {fileStatus}
 */
exports.deleteFileFromStorage = async (event, context) => {
  let responseStatusCode = 500, responseBody, responseHeaders;

  try {
    const requestBody = await authenticate.normalizeRequest(event);

    // check if error while forming the request body
    if (requestBody.error) {
      responseStatusCode = requestBody.error.statusCode;
      responseHeaders = await authenticate.getResponseHeaders();
      responseBody = JSON.stringify(requestBody);
    }
    // decrypt the csrf token and retrieve access token
    // and delete the requested file from the storage
    else {
      let decryptCsrfToken = await authenticate.getAccessDataFromCsrfToken(requestBody.headers);
      if (decryptCsrfToken.error) {
        responseStatusCode = decryptCsrfToken.error.statusCode;
        responseHeaders = await authenticate.getResponseHeaders();
        responseBody = decryptCsrfToken.error.message;
      }
      else {
        let decodedJwtUserData = await authenticate.getDecodedJwt(requestBody.body.jwt);

        responseHeaders = await authenticate.getResponseHeaders(decryptCsrfToken.accessData.accessToken, decryptCsrfToken.accessData.userId);
        
        let deleteFileData = await gcpFactory.deleteFileFromBucket(decodedJwtUserData, requestBody.body.fileName);
        if (deleteFileData.error) {
          responseStatusCode = deleteFileData.error.statusCode;
          responseBody = deleteFileData.error.message;
        }
        else {
          responseStatusCode = deleteFileData.status.code;
          responseBody = deleteFileData.status.message;
        }
      }
    }
  }
  catch (exception) {
    responseHeaders = responseHeaders ? responseHeaders : await authenticate.getResponseHeaders();
    responseStatusCode = 500;
    responseBody = JSON.stringify({error: exception.message, stack: exception.stack});
  }

  return {
    "statusCode": responseStatusCode,
    "headers": responseHeaders,
    "body": responseBody,
    "isBase64Encoded": false
  };
};
/**
 * @description delete the session and log out user
 * @argument {header.csrf_token}
 * @returns {userStatus}
 */
exports.githubUserSignOut = async (event, context) => {
  let responseStatusCode = 500, responseBody, responseHeaders;

  try {
    const requestBody = await authenticate.normalizeRequest(event);

    // check if error while forming the request body
    if (requestBody.error) {
      responseStatusCode = requestBody.error.statusCode;
      responseHeaders = await authenticate.getResponseHeaders();
      responseBody = JSON.stringify(requestBody);
    }
    // decrypt the csrf token and retrieve access token
    // and delete the session and log out user
    else {
      let decryptCsrfToken = await authenticate.getAccessDataFromCsrfToken(requestBody.headers);
      if (decryptCsrfToken.error) {
        responseStatusCode = decryptCsrfToken.error.statusCode;
        responseHeaders = await authenticate.getResponseHeaders();
        responseBody = decryptCsrfToken.error.message;
      }
      else {
        // authenticate.getResponseHeaders arguments are {accessToken, userId, logoutUser: boolean}
        responseHeaders = await authenticate.getResponseHeaders(false, false, true);
        responseStatusCode = 200;
        responseBody = "successfully logged out the user";
      }
    }
  }
  catch (exception) {
    responseHeaders = responseHeaders ? responseHeaders : await authenticate.getResponseHeaders();
    responseStatusCode = 500;
    responseBody = JSON.stringify({error: exception.message, stack: exception.stack});
  }

  return {
    "statusCode": responseStatusCode,
    "headers": responseHeaders,
    "body": responseBody,
    "isBase64Encoded": false
  };
};