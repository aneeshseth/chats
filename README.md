# End to End Chat Application with One-on-One Calling Func and more

Technologies Used:

Frontend: ReactJS
Backend: Express.js, Node.js
Real-Time Communication: WebRTC, Socket.io
Databases: SQL for user data storage, Cassandra for chat storage
Message Queue: RabbitMQ
In-Memory Cache: Redis


Through this project, I implemented and learnt the following:

- Implemented a JWT authentication system to authenticate and authorize users.
- Used Amazon S3's SDK to store user profile images.
- Used SQL to store user information, and user's profile images are retrieved based on their unique username.
- Used CasandraDB for all chats due to its ability to handle higher throughput than MongoDB or SQL, exploring key spaces, clustering, and working without traditional foreign keys.
- Used Socket.io to facilitate real-time communication between users in chats.
- Used in-memory Redis to store user data about their status based on Socket connections, (online, offline). Also used redis to store which room (chat-room) the user is in, to create an efficient read, delivered, and sent system.
- Learnt about why using an in-memory data storage like Redis is beneficial here, but this also comes along with the fact that there now exists a single point of failure, which is something I could address.
  - If a user sent a message to another user, if the other user is online and in the room, the message is sent to a queue (RabbitMQ) which has workers to add that message to the DB, and is sent back       via web-sockets and marked as *read* on the frontend.
  - If the other user was online but not in the chat-room, the message is still sent back but sent back with a status delivered.
  - If the other user was offline, the message is not sent back and just added to the DB, which is accessed when the user comes online.
- I also added one-to-one calling using WebRTC, a technology used to create browser-to-browser connections. I along the way learnt about NAT, STUN servers, ICE candidates, SDPs, what local and remote descriptions are, how the handshake before a connection is established works, and more.
