const { spawn } = require("child_process");

const getRecom = (req, res) => {
  try {
    const { course, n } = req.body;
    if (!course) {
      return res.status(400).send({ error: "Missing course" });
    }

    const getrecom = spawn("python", ["model.py", course, n]);
    // console.log(course);

    let output = "";
    let errorOutput = "";

    getrecom.stdout.on("data", (data) => {
      output += data.toString();
    });

    getrecom.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    getrecom.on("close", (code) => {
      if (code !== 0) {
        console.error(`Child process exited with code ${code}`);
        console.error(`stderr: ${errorOutput}`);
        return res.status(500).send({ error: errorOutput });
      }
      res.send(output);
    });

    getrecom.on("error", (err) => {
      console.error(`Failed to start subprocess: ${err.message}`);
      return res
        .status(500)
        .send({ error: `Failed to start subprocess: ${err.message}` });
    });
  } catch (err) {
    console.error(`Unexpected error: ${err.message}`);
    res.status(500).send({ error: `Unexpected error: ${err.message}` });
  }
};

module.exports = {
  getRecom,
};
