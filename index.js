const express = require("express");
var cors = require("cors");
var bodyParser = require("body-parser");
const mongoose = require("mongoose");
const alertRoutes = require("./routes/alertRoute");

const app = express();
const port = 3000;

app.use(cors());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(bodyParser.json());
app.use(
  bodyParser.text({
    type: "text/plain",
  })
);
app.use("/alert", alertRoutes);
app.use(express.static('public'))

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
let username = "ali";
let password = "ali";
let cluster = "cluster0";
let dbname = "teamMoplet";
// let url1 = `mongodb+srv://${username}:${password}@${cluster}.mongodb.net/${dbname}?retryWrites=true&w=majority`;
let url2 = `mongodb+srv://ali:ali@cluster0.uxqps.gcp.mongodb.net/${dbname}?retryWrites=true&w=majority`;

mongoose.connect(url2, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("Connected successfully");
});

// app.get("/", (req, res) => {
//   res.send("hellooo");
// });

app.listen(port, (err, data) => {
  err &&
    console.log({
      TAG: "INDEX JS",
      err,
    });

  console.log(`Example app listening on port ${port}`);
});
