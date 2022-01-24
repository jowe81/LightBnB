const { Pool } = require('pg');

const db = new Pool({
  user: 'vagrant',
  host: 'localhost',
  database: 'lightbnb'
});

module.exports = { db };