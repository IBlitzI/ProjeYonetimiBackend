const express = require("express");
const cors = require("cors");
const router = require("./router/index");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const http = require("http");
const routes = require("./router/index");

const app = express();
app.use(cors());

const server = http.createServer(app);
app.use(express.static("public"));
app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use("/", routes);

require("dotenv").config();
const db = require("./db/mongoose.connection");
db.connectToMongoDb();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
