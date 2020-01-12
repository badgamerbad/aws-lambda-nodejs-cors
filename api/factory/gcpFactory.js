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

const bucketName = process.env.BUCKET_NAME;

const gcp = {
	/**
	 * @description fuction to call GCP methods to generate signed url for requested file
	 * @returns {signedUrl, error}
	 */
	getSignedUrl: async (gcpOptions, fileName) => {
		let error, url;
		try {
			// Get a v4 signed URL for uploading file
			const [generatedSignedUrl] = await storage
				.bucket(bucketName)
				.file(fileName)
				.getSignedUrl(gcpOptions);

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

		return {url, error};
	},
	/**
	 * @description fuction to call GCP methods to get all requested files
	 * @returns {files, error}
	 */
	getFilesFromBucket: async () => {
		let error, files;
		try {
			// Get list of files for logged in user
			const [allFilesFromBucket] = await storage.bucket(bucketName).getFiles();

			if (!allFilesFromBucket) {
				error = {
					statusCode: 500,
					message: "Failed getting the file list",
				}
			}
			else {
				files = allFilesFromBucket;
			}
		}
		catch(exception) {
			error = {
				statusCode: 500,
				message: exception.message,
			}
		}

		return { files, error };
	},
	/**
	 * @description fuction to call GCP methods to delete the requested file
	 * @returns {status, error}
	 */
	deleteFileFromBucket: async fileName => {
		let error, status;
		try {
			// Get list of files for logged in user
			const [fileStatus] = await storage.bucket(bucketName).file(fileName).delete();

			if (!fileStatus) {
				error = {
					statusCode: 500,
					message: "Failed deleting the file list",
				}
			}
			else {
				status = fileStatus;
			}
		}
		catch(exception) {
			error = {
				statusCode: 500,
				message: exception.message,
			}
		}

		return {status, error};
	}
}

const gcpFactory = {
	/**
	 * @description generate a signed url to upload the file from client side
	 * directly from the browser to GCP bucket
	 * @param {userId, fileType}
	 * @returns {uploadedFileData, error}
	 */
	getSignedUrlWrite: async requestBody => {
		let error, uploadedFileData;

		const uploadedFileName = `${uuid()}_${requestBody.userId}.${requestBody.fileType.replace(/image\//g, "")}`;

		const gcpOptions = {
			version: 'v4',
			action: "write",
			expires: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
			contentType: requestBody.fileType,
		};

		let getSignedUrl = await gcp.getSignedUrl(gcpOptions, uploadedFileName);
		if(getSignedUrl.error) {
			error = getSignedUrl.error;
		}
		else {
			uploadedFileData = {
				url: getSignedUrl.url,
				uploadedFileName
			}
		}

		return { uploadedFileData, error };
	},
	/**
	 * @description generate signed url for the uploaded file by its user
	 * @returns {url, error}
	 */
	getSignedUrlForFile: async (userId, requestedfileName) => {
		let error, url;

		let allFilesFromBucket = await gcp.getFilesFromBucket();
		if(allFilesFromBucket.error) {
			error = allFilesFromBucket.error;
		}
		else {
			let _files = allFilesFromBucket.files;
			let validFileName;
			for(let i = 0; i < _files.length; ++i) {
				if(_files[i].name.indexOf(`_${userId}`) > -1 && requestedfileName === _files[i].name) {
					validFileName = _files[i].name;
				}
			}
			if(!validFileName) {
				error = {
					statusCode: 400,
					message: "Invalid File Name",
				}
			}
			else {
				const gcpOptions = {
					version: 'v4',
					action: "read",
					expires: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
				};
		
				let getSignedUrl = await gcp.getSignedUrl(gcpOptions, validFileName);
				if(getSignedUrl.error) {
					error = getSignedUrl.error;
				}
				else {
					url = getSignedUrl.url;
				}
			}
		}

		return { url, error };
	},
	/**
	 * @description fetch the files for specific user
	 * @returns {files, error}
	 */
	getFilesForUser: async userId => {
		let error, files;

		let allFilesFromBucket = await gcp.getFilesFromBucket();
		if(allFilesFromBucket.error) {
			error = allFilesFromBucket.error;
		}
		else {
			let filteredFiles = [];
			let _files = allFilesFromBucket.files;
			for(let i = 0; i < _files.length; ++i ) {
				if(_files[i].name.indexOf(`_${userId}`) > -1)
					filteredFiles.push(_files[i].name);
			}
			files = filteredFiles;
		}

		return { files, error };
	},
	/**
	 * @description delete the requested file from the storage and return status
	 * @return {status, error}
	 */
	deleteFileFromBucket: async fileName => {
		let status, error;

		let fileStatus = await gcp.deleteFileFromBucket(fileName);
		if(fileStatus.error) {
			error = fileStatus.error;
		}
		else {
			status = fileStatus.status;
		}

		return { status, error };
	}
}

module.exports = gcpFactory;