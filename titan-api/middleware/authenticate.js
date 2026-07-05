const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json("認証が必要です");
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, "titan_secret");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json("認証が必要です");
  }
}

module.exports = authenticate;
