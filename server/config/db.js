require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const mysql = require("mysql2");

console.log("ENV DB_HOST:", process.env.DB_HOST);
console.log("ENV DB_USER:", process.env.DB_USER);
console.log("ENV DB_PASS:", process.env.DB_PASSWORD ? "[loaded]" : "undefined");
console.log("ENV DB_NAME:", process.env.DB_NAME);

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.log("DB connection failed:", err);
  } else {
    console.log("MySQL Connected!");
  }
});

module.exports = db;