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
  const queryParams = [];

  let queryString = `
    SELECT properties.*, AVG(property_reviews.rating) as average_rating 
    FROM properties
    JOIN property_reviews ON property_reviews.property_id = properties.id
  `;

  //The 'WHERE city' clause below will always be added, whether or not the filter has been set. Here's why:
  //Together with the wildcard (%) on the parameter it serves a triple purpose
  // - the wildcard will make the clause still find cities with only part of their names entered
  // - the wildcard saves me the hassle of programmatically determining whether to use AND or WHERE
  //   for the next option that's been set; it will always be AND, because an empty options.city
  //   parameter will have the same result as omitting the filter entirely
  // - the third benefit is that minimum_price_per_night and maximum_price_per_night can be
  //   used independent of each other (it's safe to set only one of the two)
  queryParams.push(`%${options.city}%`);
  queryString += `WHERE city LIKE $${queryParams.length} `;

  if (options.owner_id) {
    queryParams.push(options.owner_id);
    queryString += `AND owner_id = $${queryParams.length} `;
  }

  if (options.minimum_price_per_night) {
    queryParams.push(options.minimum_price_per_night * 100); //dollars to cents
    queryString += `AND cost_per_night >= $${queryParams.length} `;
  }

  if (options.maximum_price_per_night) {
    queryParams.push(options.maximum_price_per_night * 100); //dollars to cents
    queryString += `AND cost_per_night <= $${queryParams.length} `;
  }

  queryString += `
    GROUP BY properties.id
  `;

  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    queryString += `HAVING AVG(property_reviews.rating) >= $${queryParams.length} `;
  }

  queryParams.push(limit);
  queryString += `
    ORDER BY cost_per_night  
    LIMIT $${queryParams.length}
  `;

  const query = {
    text: queryString,
    values: queryParams
  };

  return pool
    .query(query)
    .then(res => res.rows)
    .catch(err => console.log(err.message));
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
