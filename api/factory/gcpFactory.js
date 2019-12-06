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

const gcpApi = {
	getSignedUrl: async () => {
		let error;
		
		const bucketName = process.env.BUCKET_NAME;
		const filename = `${uuid()}.${request.query.fileType.replace(/image\//g, "")}`;

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

		return { url, error };
	}
}

module.exports = gcpApi;