"use strict";

// for generating unique file name
const uuid = require("uuid/v1");

// Imports the Google Cloud client library
const { Storage } = require("@google-cloud/storage");
// Creates a client
const storage = new Storage({
  projectId: process.env.PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const gcpFactory = {
	/**
	 * @description generate a signed url to upload the file from client side
	 * directly from the browser to GCP bucket
	 * @param object {userId, fileType}
	 * @returns object {url, error}
	 */
	getSignedUrl: async requestBody => {
		let error, url;
		
		const bucketName = process.env.BUCKET_NAME;
		const filename = `${uuid()}_${requestBody.userId}.${requestBody.fileType.replace(/image\//g, "")}`;

		const gcpSignedUrlOptions = {
			version: 'v4',
			action: 'write',
			expires: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
			contentType: requestBody.fileType,
		};

		try {
			// Get a v4 signed URL for uploading file
			const [generatedSignedUrl] = await storage
				.bucket(bucketName)
				.file(filename)
				.getSignedUrl(gcpSignedUrlOptions);

			if (!generatedSignedUrl) {
				error = {
					statusCode: 500,
					message: "Failed generating GCP signed URL",
				}
			}
			else {
				url = generatedSignedUrl;
			}
		}
		catch(exception) {
			error = {
				statusCode: 500,
				message: exception.message,
			}
		}

		return { url, error };
	}
}

module.exports = gcpFactory;