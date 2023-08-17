const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { createClient } = require("redis");
const { Client } = require("cassandra-driver");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const bucketName = "bucket-test-27";
const bucketRegion = "us-east-1";
const accessKey = "AKIA35VTPTMRMIIDUBMY";
const secretAccessKey = "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";
const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
  region: bucketRegion,
});
app.post("/images", upload.single("image"), async (req, res) => {
  console.log(req.body);
  console.log(req.file);
  const params = {
    Bucket: bucketName,
    Key: req.file.originalname,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  };
  const command = new PutObjectCommand(params);
  await s3.send(command);
  res.send("sentimage");
});

const clientCassandra = new Client({
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
  await clientCassandra.connect();
  console.log("Cassandra connected for queue.");
};

run();
const amqp = require("amqplib");
let client;
async function nodeRedisDemo() {
  try {
    client = createClient();
    await client.connect();
    console.log("redis");
  } catch (e) {
    console.error(e);
  }
}
nodeRedisDemo();

async function addToDatabase(messageContent) {
  const { message, id, userUsername } = messageContent;
  console.log(message);
  console.log(id);
  console.log(userUsername);
  const query = `INSERT INTO imessage.MESSAGES (msgid, timestamp, chatid, content, contenttype, sender, status) VALUES (${
    Math.floor(Math.random() * 5) + 1
  }, toUnixTimestamp(now()), ${id}, '${message}', 'text', '${userUsername}', 'read' )`;
  try {
    await clientCassandra.execute(query);
    return;
  } catch (err) {
    return console.log(err);
  }
}

const UserSignUpQueue = "message_queue";
let amqpConnection;
let amqpChannel;
async function connectToMQ() {
  try {
    amqpConnection = await amqp.connect("amqp://localhost");
    amqpChannel = await amqpConnection.createChannel();
    await amqpChannel.assertQueue(UserSignUpQueue, { durable: true });
    amqpChannel.consume(UserSignUpQueue, async (message) => {
      const messageContent = JSON.parse(message.content.toString());
      console.log("Received message from queue:", messageContent);
      await addToDatabase(messageContent);
      amqpChannel.ack(message);
    });
    console.log("Connected to RabbitMQ");
  } catch (err) {
    console.error("Error connecting to RabbitMQ:", err);
  }
}

connectToMQ();
const rooms = {};
const users = {};
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true,
  },
});
app.use(
  cors({
    credentials: true,
    origin: true,
  })
);

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);
  let userId;
  socket.on("status:online", async (data) => {
    try {
      if (client.get(data) != null) {
        await client.del(data);
      }
      console.log(data);
      await client.set(data, "online");
      userId = data;
      console.log(userId);
    } catch (err) {
      console.log(err);
    }
  });
  socket.on("user:left", async (data) => {
    console.log(data);
    await client.del(data);
  });
  socket.on("disconnecting", (data) => {
    console.log(data);
  });
  socket.on("join:room", async (data) => {
    const { id, userUsername } = data;
    const roomId = id;
    users[socket.id] = {
      roomId: roomId,
    };
    if (!rooms[roomId]) {
      rooms[roomId] = {
        roomId,
        users: [],
      };
    }
    rooms[roomId].users.push(socket.id);
    socket.join(id);
    try {
      console.log(userUsername[0]);
      const currentLrange = await client.lRange(id, 0, -1);
      if (currentLrange.find((username) => username === userUsername[0])) {
        console.log(currentLrange);
        return;
      }
      await client.lPush(id, userUsername[0]);
      const getLrange = await client.lRange(id, 0, -1);
      console.log(getLrange);
    } catch (error) {
      console.error(error);
    }
  });

  socket.on("remove:cache", async (data) => {
    const { userUsername, id } = data;
    try {
      await client.lRem(id, 0, userUsername[0]);
      const updatedLrange = await client.lRange(id, 0, -1);
      console.log("Updated cache:", updatedLrange);
    } catch (err) {
      console.log(err);
    }
  });

  socket.on("send:message", async (data) => {
    const currentLrange = await client.lRange(data.id, 0, -1);
    let checkOnline;
    try {
      checkOnline = await client.get(data.otherUser[0]);
    } catch (err) {
      console.log(err);
    }
    console.log(checkOnline);
    if (currentLrange.length > 1) {
      amqpChannel.sendToQueue(
        UserSignUpQueue,
        Buffer.from(
          JSON.stringify({
            message: data.message,
            id: data.id,
            userUsername: data.userUsername[0],
          })
        )
      );
      socket.emit("receive_message", {
        content: data.message,
        status: "seen",
        sender: data.userUsername[0],
      });
      socket.to(data.id).emit("receive_message", {
        content: data.message,
        status: "seen",
        sender: data.userUsername[0],
      });
    } else if (checkOnline != null) {
      await amqpChannel.sendToQueue(
        UserSignUpQueue,
        Buffer.from(
          JSON.stringify({
            message: data.message,
            id: data.id,
            userUsername: data.userUsername[0],
          })
        )
      );
      socket.emit("receive_message", {
        content: data.message,
        status: "delivered",
        sender: data.userUsername[0],
      });
      socket.to(data.id).emit("receive_message", {
        content: data.message,
        status: "delivered",
        sender: data.userUsername[0],
      });
    } else {
      await amqpChannel.sendToQueue(
        UserSignUpQueue,
        Buffer.from(
          JSON.stringify({
            message: data.message,
            id: data.id,
            userUsername: data.userUsername[0],
          })
        )
      );
      socket.emit("receive_message", {
        content: data.message,
        status: "sent",
        sender: data.userUsername[0],
      });
      socket.to(data.id).emit("receive_message", {
        content: data.message,
        status: "sent",
        sender: data.userUsername[0],
      });
    }
  });
  socket.on("localDescription", (params) => {
    let roomId = users[socket.id].roomId;

    let otherUsers = rooms[roomId].users;
    otherUsers.forEach((otherUser) => {
      if (otherUser !== socket.id) {
        io.to(otherUser).emit("localDescription", {
          description: params.description,
        });
      }
    });
  });
  socket.on("remoteDescription", (params) => {
    let roomId = users[socket.id].roomId;
    let otherUsers = rooms[roomId].users;

    otherUsers.forEach((otherUser) => {
      if (otherUser !== socket.id) {
        io.to(otherUser).emit("remoteDescription", {
          description: params.description,
        });
      }
    });
  });
  socket.on("iceCandidate", (params) => {
    let roomId = users[socket.id].roomId;
    let otherUsers = rooms[roomId].users;

    otherUsers.forEach((otherUser) => {
      if (otherUser !== socket.id) {
        io.to(otherUser).emit("iceCandidate", {
          candidate: params.candidate,
        });
      }
    });
  });
  socket.on("iceCandidateReply", (params) => {
    let roomId = users[socket.id].roomId;
    let otherUsers = rooms[roomId].users;

    otherUsers.forEach((otherUser) => {
      if (otherUser !== socket.id) {
        io.to(otherUser).emit("iceCandidateReply", {
          candidate: params.candidate,
        });
      }
    });
  });

  socket.on("disconnect", async () => {
    await client.del(userId);
  });
});

const authRoutes = require("./Routes/authenticationRoutes");
const chatGroupRoutes = require("./Routes/chatGroupRoutes");
const messagingRoutes = require("./Routes/messagingRoutes");
require("dotenv").config();
app.use(express.json());
app.use("/", authRoutes);
app.use("/", chatGroupRoutes);
app.use("/", messagingRoutes);

server.listen(3200, () => {
  console.log("SERVER IS RUNNING");
});
