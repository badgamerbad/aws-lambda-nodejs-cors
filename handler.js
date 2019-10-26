'use strict';
const request = require('request');

const config = {
  clientId: 'Iv1.c6778b1c26a766bd',
  clientSecret: '24ee9c042bafc74699ff49270b0403da31e7ce30',
  redirectUri: 'http://localhost:8000/',
  allowedOrigins: ['http://localhost:8000/', 'https://localhost:8000/'],
};

const githutAccessTokenGenerator = function (event, context, callback) {
  // Retrieve the request, more details about the event variable later
  const headers = event.headers;
  const body = JSON.parse(event.body);
  const origin = headers.Origin;

  // Check for malicious request
  if (!config.allowedOrigins.includes(origin)) {
    body.message = `${origin} is not an allowed origin.`;
    callback(null, {
      "statusCode": 500,
      "headers": {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      "body": JSON.stringify(body),
      "isBase64Encoded": false
    });
  }

  let url = 'https://github.com/login/oauth/access_token';
  let options = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      code: body.code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      state: body.state,
    }),
  };

  // Request to GitHub with the given code
  request(url, options, function (err, response) {
    let responseData = response.body;
    let statusCode = 200;
    if (err) {
      responseData = err;
      statusCode = 500;
    }

    callback(
      null,
      {
        "statusCode": statusCode,
        "headers": {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        "body": JSON.stringify(responseData),
        "isBase64Encoded": false
      }
    );
  });
};

module.exports = { githutAccessTokenGenerator: githutAccessTokenGenerator } 