const { Storage } = require("@google-cloud/storage");
const crypto = require("crypto");

const storage = new Storage();
const bucketName = "cv-extract-jobs";

async function uploadToGCS(fileBuffer, fileName, mimeType) {
  // Generate a hash of the file contents to use as the filename
  const hash = crypto.createHash("md5").update(fileBuffer).digest("hex");
  const uniqueFileName = `${hash}_${fileName}`;

  const bucket = storage.bucket(bucketName);
  const file = bucket.file(uniqueFileName);

  // Check if the file already exists
  const [exists] = await file.exists();
  if (exists) {
    return `gs://${bucketName}/${uniqueFileName}`;
  }

  // Upload the file if it does not exist
  await file.save(fileBuffer, {
    metadata: { contentType: mimeType },
    resumable: false,
  });

  return `gs://${bucketName}/${uniqueFileName}`;
}

async function downloadFromGCS(srcFilename, destFilename) {
  const options = {
    destination: destFilename,
  };

  await storage.bucket(bucketName).file(srcFilename).download(options);
}

async function listFiles() {
  const [files] = await storage.bucket(bucketName).getFiles();
  console.log("Files:");
  files.forEach((file) => {
    console.log(file.name);
  });
}

module.exports = { uploadToGCS, downloadFromGCS, listFiles };
