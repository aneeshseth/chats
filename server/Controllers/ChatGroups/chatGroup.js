const { Client } = require("cassandra-driver");

const client = new Client({
  cloud: {
    secureConnectBundle: "secure-connect-w-hackathon.zip",
  },
  credentials: {
    username: "YimjEecgadkDOypoGAMhLQzi",
    password:
      ",,Cx06DdKdnsDYXSg+4t0jM3bajZ,mzR4Q44XqDl+i_uWOrPdfIFu_+.k99o,dE4eZpz9g.dzYx2CW1eZKSN02bsqEqAWlnUBeAtk0wBFkhKMnoxWQp7Jcg86YCcLCAT",
  },
});

const run = async () => {
  await client.connect();
  console.log("Cassandra connected.");
};

run();

const { createClient } = require("redis");
let redisClient;
async function nodeRedisDemo() {
  try {
    redisClient = createClient();
    await redisClient.connect();
    console.log("redis in chatGroups");
  } catch (e) {
    console.error(e);
  }
}
nodeRedisDemo();

const getChatGroups = async (request, response) => {
  const chatsCache = await redisClient.get(request.headers["userId"] + "chats");
  if (chatsCache != null) {
    return response.status(200).send(JSON.parse(chatsCache));
  }
  const query = `SELECT * FROM imessage.CHAT_GROUPS WHERE USERS CONTAINS '${request.headers["userId"]}' `;
  try {
    const result = await client.execute(query);
    redisClient.set(
      request.headers["userId"] + "chats",
      JSON.stringify(result.rows)
    );
    return response.status(200).send(result.rows);
  } catch (error) {
    console.error("Error executing query:", error);
  }
};

module.exports = { getChatGroups };
