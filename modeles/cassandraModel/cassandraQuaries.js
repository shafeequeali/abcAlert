export const retriveAllDoc = (tableName, keySpaces = "test") => {
  let query = "";
  if (tableName) {
    query = `SELECT * FROM ${keySpaces}.${tableName}`;
  } else {
    query = "input required";
  }
  return query;
};

export const insertQuery = (tableName, keys, values, keySpaces = "test") => {
  let query = "";
  if (tableName && keys && values) {
    query = `INSERT INTO ${keySpaces}.${tableName} (key, text, date) VALUES (?, ?, ?)`;
  } else {
    query = "input required";
  }
  return query;
};

// -----------------------tempraro querry ---starts------------

export const createTableQuarry =
  "CREATE TABLE IF NOT EXISTS test.users2 (lastname text PRIMARY KEY, age int, city text, email text, firstname text);";

export const insertUser =
  "INSERT INTO test.users2 (lastname, age, city, email, firstname) VALUES (?,?,?,?,?)";

export const countQuarry = "SELECT COUNT(*) FROM test.users2";

//e.g
const updatequery = "updte <table name> set <colum name> = 'value' where id=2";

