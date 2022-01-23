const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  host: 'localhost',
  database: 'lightbnb'
});

const properties = require('./json/properties.json');
const users = require('./json/users.json');

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  const query = {
    text: 'SELECT * FROM users WHERE email = $1 LIMIT 1;',
    values: [email]
  };
  return pool
    .query(query)
    .then(res => res.rows[0] || null)
    .catch(err => console.log(err.message));
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  const query = {
    text: 'SELECT * FROM users WHERE id = $1;',
    values: [id]
  };
  return pool
    .query(query)
    .then(res => res.rows[0] || null)
    .catch(err => console.log(err.message));
};
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  const query = {
    text: 'INSERT INTO users (name, email, password) VALUES($1, $2, $3) RETURNING *;',
    values: [user.name, user.email, user.password]
  };
  return pool
    .query(query)
    .then(res => res.rows[0] || null)
    .catch(err => console.log(err.message));
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  const query = {
    text: `
      SELECT reservations.*, properties.*, AVG(property_reviews.rating) AS average_rating
      FROM reservations
      JOIN properties ON reservations.property_id = properties.id
      JOIN property_reviews ON property_reviews.property_id = reservations.property_id
      WHERE reservations.guest_id = $1
      GROUP BY reservations.id, properties.id
      ORDER BY reservations.start_date
      LIMIT 10;    
    `,
    values: [guest_id]
  };
  return pool
    .query(query)
    .then(res => res.rows)
    .catch(err => console.log(err.message));
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = (options, limit = 10) => {

  const query = {
    text: 'SELECT * FROM properties LIMIT $1',
    values: [ limit ]
  };

  return pool
    .query(query)
    .then(res => {
      return res.rows;
    })
    .catch(err => console.log(err.message));

  /*
  //My initial implementation (which also works:)
  return new Promise((resolve, reject) => {

  
    pool
      .query(query)
      .then(res => {
        resolve(res.rows);
      })
      .catch(err => console.log(err.message));
  
  });
  */
};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
}
exports.addProperty = addProperty;
