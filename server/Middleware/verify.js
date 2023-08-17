const jwt = require("jsonwebtoken");

const verify = (request, response, next) => {
  const authHeader = request.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, "ANEESH", (err, user) => {
      if (err) {
        return response.sendStatus(403);
      }
      if (!user) {
        return response.sendStatus(403);
      }
      if (typeof user === "string") {
        return response.sendStatus(403);
      }
      request.headers["userId"] = user.username;
      next();
    });
  } else {
    console.log("ERROR HERE!");
    return response.sendStatus(403);
  }
};

module.exports = { verify };
