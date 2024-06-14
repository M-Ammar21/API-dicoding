const { spawn } = require("child_process");

function recommendJobs(cvExtractResult, n) {
  return new Promise((resolve, reject) => {
    const getRecom = spawn("python", [
      "models/model.py",
      JSON.stringify(cvExtractResult),
      n,
    ]);

    let recomResult = "";
    let errorOutput = "";

    getRecom.stdout.on("data", (data) => {
      recomResult += data.toString();
    });

    getRecom.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    getRecom.on("close", (code) => {
      if (code !== 0) {
        console.error(`Job Recommendation exited with code ${code}`);
        console.error(`stderr: ${errorOutput}`);
        reject(new Error(errorOutput));
      } else {
        resolve(recomResult);
      }
    });

    getRecom.on("error", (err) => {
      reject(
        new Error(
          `Failed to start job recommendation subprocess: ${err.message}`
        )
      );
    });
  });
}

module.exports = { recommendJobs };
