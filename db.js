const { Pool } = require("pg");

const db = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: 5432,
  database: process.env.POSTGRES_DB,
  ssl: {
    rejectUnauthorized: process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED === "true",
  },
});

const query = (text, params) => db.query(text, params);

module.exports = { db, query };
