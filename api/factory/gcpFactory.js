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
		try {
			const bucketName = process.env.BUCKET_NAME;
			const filename = `${uuid()}_${requestBody.userId}.${requestBody.fileType.replace(/image\//g, "")}`;

			const gcpSignedUrlOptions = {
				version: 'v4',
				action: "write",
				expires: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
				contentType: requestBody.fileType,
			};

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
	},
	getFilesForUser: async userId => {
		let error, files;
		try {
			const bucketName = process.env.BUCKET_NAME;

			// Get list of files for logged in user
			const [allFilesArray] = await storage.bucket(bucketName).getFiles();

			if (!allFilesArray) {
				error = {
					statusCode: 500,
					message: "Failed getting the file list",
				}
			}
			else {
				let filteredFiles = [];
				for(let i = 0; i < allFilesArray.length; ++i ) {
					if(allFilesArray[i].name.indexOf(`_${userId}`) > -1)
						filteredFiles.push(allFilesArray[i].name);
				}
				files = filteredFiles;
			}
		}
		catch(exception) {
			error = {
				statusCode: 500,
				message: exception.message,
			}
		}

		return { files, error };
	}
}

module.exports = gcpFactory;