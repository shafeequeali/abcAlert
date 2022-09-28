const cassandra = require("cassandra-driver");
var path = require("path");
var absolutePath = path.resolve("./secure-connect-moplet-test.zip");

module.exports.client = new cassandra.Client({
  cloud: { secureConnectBundle: absolutePath },
  credentials: {
    username: "HKSrXCZifaMHikBpqwhNjMKz",
    password:
      "CruGjrnvMyb8NopiB+pMwx6-Dg+Bs6+GPmyOaa,PS37LY+-rBLufN_xBmWBC35alpu_h_teQXMf_Tg9N7ChfKWUU6yxbJ69FHXWXjyJJY_LizvPc6a6aPKiAK,pmqyZu",
  },
});
