const { MongoClient } = require("mongodb");
const state = {
  db: null,
};
const url = "mongodb://127.0.0.1:27017";
const dbName = "shopping";
const client= new MongoClient(url)
const connect = async function(done) {
  await client.connect();
  console.log("Connected to database");
  state.db=client.db(dbName);

  return 'done.';
};
const get=()=>state.db
module.exports={
  connect,
  get
}
// module.exports.get = function () {
//   return state.db;
// };

// async function main() {
//   // Use connect method to connect to the server
//   await client.connect();
//   console.log("Connected successfully to server");
//   const db = client.db(dbName);
//   const collection = db.collection("documents");

//   // the following code examples can be pasted here...

//   return "done.";
// }

// main()
//   .then(console.log)
//   .catch(console.error)
//   .finally(() => client.close());
