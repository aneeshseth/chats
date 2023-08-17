const mysql = require("mysql");
require("dotenv").config();
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "new-password",
  database: process.env.DB,
});
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const defaultEXP = 3600;
const { createClient } = require("redis");
let client;
async function nodeRedisDemo() {
  try {
    client = createClient();
    await client.connect();
    console.log("redis connected in auth");
  } catch (e) {
    console.error(e);
  }
}
nodeRedisDemo();

const RegisterUser = async (request, response) => {
  const { email, password, name, username, image } = request.body;
  pool.query(
    "SELECT * FROM USERS WHERE USERNAME = ?",
    [username],
    async (err, res) => {
      if (err || res.length > 0) {
        return response.sendStatus(400);
      }
      bcrypt.hash(password, 10, function (err, hashedPass) {
        if (err) {
          throw err;
        }
        pool.query(
          "INSERT INTO USERS (email, password, name, username, image) VALUES (?,?,?,?,?)",
          [email, hashedPass, name, username, image],
          (err, data) => {
            if (err) {
              throw err;
            }
            pool.query(
              "SELECT * FROM USERS WHERE ID = ?",
              [data.insertId],
              (err, final) => {
                if (err) {
                  throw err;
                }
                console.log(final);
                const token = jwt.sign(
                  { username: final[0].username },
                  "ANEESH",
                  {
                    expiresIn: "20d",
                  }
                );
                return response
                  .status(201)
                  .json({ token: token, id: data.insertId });
              }
            );
          }
        );
      });
    }
  );
};

const LoginUser = async (request, response) => {
  const { username, password } = request.body;
  pool.query(
    "SELECT * FROM USERS WHERE USERNAME = ?",
    [username],
    async (err, res) => {
      if (err || res.length === 0) {
        return response.sendStatus(400);
      }
      const compare = await bcrypt.compare(password, res[0].password);
      if (compare) {
        const token = jwt.sign({ username: res[0].username }, "ANEESH", {
          expiresIn: "20d",
        });
        return response.status(200).json({ token: token, id: res[0].ID });
      } else {
        return response.sendStatus(403);
      }
    }
  );
};

const UserById = async (request, response) => {
  try {
    const userId = request.headers["userId"] || "";
    const cachedUser = await client.get(userId.toString() + "user");
    if (cachedUser != null) {
      return response.status(200).send(JSON.parse(cachedUser));
    } else {
      pool.query(
        "SELECT * FROM USERS WHERE USERNAME = ?",
        [userId],
        async (err, res) => {
          if (err) {
            throw err;
          }
          console.log(userId);
          await client.setEx(
            userId.toString() + "user",
            defaultEXP,
            JSON.stringify(res[0])
          );
          return response.status(200).send(res[0]);
        }
      );
    }
  } catch (err) {
    console.log("error location found.");
    console.log(err);
  }
};

const searchUsers = async (request, response) => {
  const { search } = request.body;

  if (!search) {
    return response.status(400).json({ message: "Search query is required." });
  }

  pool.query(
    "SELECT * FROM users WHERE username LIKE ?",
    [`%${search}%`],
    (err, result) => {
      if (err) {
        throw err;
      }
      return response.status(200).send(result);
    }
  );
};

module.exports = {
  RegisterUser,
  LoginUser,
  UserById,
  searchUsers,
};

/*
{
  "clientID": "YimjEecgadkDOypoGAMhLQzi"
  "clientSecret": ",,Cx06DdKdnsDYXSg+4t0jM3bajZ,mzR4Q44XqDl+i_uWOrPdfIFu_+.k99o,dE4eZpz9g.dzYx2CW1eZKSN02bsqEqAWlnUBeAtk0wBFkhKMnoxWQp7Jcg86YCcLCAT"
  "token": "AstraCS:YimjEecgadkDOypoGAMhLQzi:67f9ae820066e56e4e089f215dfaa8bd1968866b833a4f9512d8ffe3068929db"
}
*/
