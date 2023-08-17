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

const getAllMessages = async (request, response) => {
  const chatId = request.params.id;
  const query = `SELECT * FROM imessage.MESSAGES WHERE chatid = ${chatId}`;
  try {
    const result = await client.execute(query);
    return response.status(200).send(result.rows);
  } catch (err) {
    return response.status(500).send(err);
  }
};

module.exports = { getAllMessages };
