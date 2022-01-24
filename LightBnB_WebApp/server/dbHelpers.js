//dbHelpers.js:
//  exports a function that will build an INSERT query from an object
//  consisting of numbers and strings

/**
 * Return a comma seperated list of property names
 * @param {Object} object An object
 * @returns {String} Comma separated list of object's properties
 */
const propertiesToCSV = object => {
  const keysArr = Object.keys(object);
  return keysArr.join(',');
};

/**
 * Return a list of the form "$1, $2, ... $n", with n placeholders
 * @param {number} n No of placeholders to concatenate
 * @returns {String} Comma separated list of placeholders
 */
const placeholdersToCSV = n => {
  const arr = [];
  for (let i = 1; i <= n; i++) {
    arr.push(`$${i}`);
  }
  return arr.join(',');
};

/**
 * Return an array with values from an object
 * @param {Object} object The object to collect the values from
 * @returns {Array} The values from object
 */
const valuesToArray = object => {
  const keysArr = Object.keys(object);
  return keysArr.map(v => object[v]);
};

/**
 * Remove empty properties of object, and convert number values to numbers
 * @param {Object} object The object to remove empty properties from
 */
const removeEmptyFields = object => {
  const keysArr = Object.keys(object);
  for (const key of keysArr) {
    const value = object[key];
    const parsedValue = Number(value);
    if (parsedValue || value.trim() === '0') {
      //parsedValue is a number: negative, positive, or zero.
      //In case of zero, it resulted from entering the digit 0, not from a falsy string
      //-> convert property to number
      object[key] = parsedValue;
    } else if (!value) {
      //parsedValue was 0, and resulted from an empty string
      //-> delete property
      delete object[key];
    }
  }
};

/**
 * Build a postgres INSERT query from an object
 * @param {Object} object The keys and values to insert
 * @param {string} tableName The table to insert into
 * @returns {Object} A query object of the form {text:"...", values:[]}
 */
const getInsertQuery = (object, tableName, returnRecord = true) => {
  removeEmptyFields(object);
  let returning;
  returnRecord ? returning = " RETURNING *" : returning = "";
  const noFields = Object.keys(object).length;
  const query = {
    'text': `INSERT INTO ${tableName} (${propertiesToCSV(object)}) VALUES (${placeholdersToCSV(noFields)})${returning};`,
    'values': valuesToArray(object)
  };
  return query;
};

module.exports = {
  getInsertQuery
};