// const cassandraConnection = require("./cassandraConnection");
const cassandra = require("cassandra-driver");
var path = require("path");
var absolutePath = path.resolve("./modeles/cassandraModel/secure-connect-moplet-test.zip");

const client = new cassandra.Client({
  cloud: { secureConnectBundle: absolutePath },
  credentials: {
    username: "HKSrXCZifaMHikBpqwhNjMKz",
    password:
      "CruGjrnvMyb8NopiB+pMwx6-Dg+Bs6+GPmyOaa,PS37LY+-rBLufN_xBmWBC35alpu_h_teQXMf_Tg9N7ChfKWUU6yxbJ69FHXWXjyJJY_LizvPc6a6aPKiAK,pmqyZu",
  },
});

const getCount = async () => {
  await client.execute(countQuarry).then((result) => {
    console.log(result.rows);
  });
};

module.exports.insertOrUpdateData = async (querry, params, callback) => {
  await client
    .execute(querry, params, { prepare: true })
    .then((data) => {
      callback(null, data);
    })
    .catch((err) => {
      callback(err, null);
    });
};
