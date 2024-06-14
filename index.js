const express = require("express");
// const getRecom = require("./handler/handler");
const { getRecom } = require("./routes/routes");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3009;

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/recom", getRecom );

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
