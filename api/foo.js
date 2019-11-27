const { Storage } = require("@google-cloud/storage");

const storage = new Storage({
    keyFilename: "./ingredoFit-f19471f70f26.json",
});

const foo = async () => {
    const bucketName = 'ingredofit.appspot.com';
    const filename = 'travel.jpg';

    const options = {
        version: 'v4',
        action: 'write',
        expires: Date.now() + 60 * 60 * 8 * 1000, // 8 hours
    };

    // Get a v4 signed URL for uploading file
    const [url] = await storage
        .bucket(bucketName)
        .file(filename)
        .getSignedUrl(options);

    console.log(url);
}

foo();