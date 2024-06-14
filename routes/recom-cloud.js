const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const app = express();
const { uploadToGCS, downloadFromGCS } = require("../utils/fileUtils");
const { extractCV } = require("../services/cvExtraction");
const { recommendJobs } = require("../services/jobRecommendation");


// const uploadCV = multer();
const multerStorage = multer.memoryStorage();
const uploadCV = multer({ storage: multerStorage });
app.use(cors());
app.use(express.json());

app.post("/recom-cloud", uploadCV.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const skill = req.body.skill;
    const n = req.body.n;

    if (!file) {
      return res.status(400).send({ error: "File Required" });
    }

    // const filePath = await uploadToGCS(
    //   file.buffer,
    //   file.originalname,
    //   file.mimetype
    //   );
      
    
    
    // const localFilePath = path.join("/tmp", file.originalname);
    // await downloadFromGCS(file.originalname, localFilePath);
    const filePath = await uploadToGCS(
      file.buffer,
      file.originalname,
      file.mimetype
    );
    const uniqueFileName = filePath.split("/").pop(); // Extract the unique file name from the path

    const localFilePath = path.join("/tmp", uniqueFileName);
    await downloadFromGCS(uniqueFileName, localFilePath);

      
      
    const cvExtractResult = await extractCV(localFilePath, skill);
    const jobRecommendations = await recommendJobs(cvExtractResult, n);

    res.send(jobRecommendations);
  } catch (err) {
    console.log(`Unexpected error: ${err.message}`);
    res.status(500).send({ error: `Unexpected error: ${err.message}` });
  }
});
const port = process.env.PORT || 3019;
app.listen(port, () => {
  console.log(`Example app listening on http://localhost:${port}`);
});

