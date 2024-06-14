const { spawn } = require("child_process");

function extractCV(filePath, skill) {
  return new Promise((resolve, reject) => {
    const cvExtract = spawn("python", ["models/model_cv.py", filePath, skill]);

    let result = "";
    let errResult = "";

    cvExtract.stdout.on("data", (data) => {
      result += data.toString();
    });

    cvExtract.stderr.on("data", (data) => {
      errResult += data.toString();
    });

    cvExtract.on("close", (code) => {
      if (code !== 0) {
        console.error(`CV Extractor exited with code ${code}`);
        console.error(`stderr: ${errResult}`);
        reject(new Error(errResult));
      } else {
        try {
          const parsedResult = JSON.parse(result);
          resolve(parsedResult);
        } catch (err) {
          reject(new Error("Failed to parse CV extraction result as JSON"));
        }
      }
    });

    cvExtract.on("error", (err) => {
      reject(
        new Error(`Failed to start CV extraction subprocess: ${err.message}`)
      );
    });
  });
}

module.exports = { extractCV };
