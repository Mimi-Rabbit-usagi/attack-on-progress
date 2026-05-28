const express = require("express");
const Database = require("better-sqlite3");
const db = new Database(`${__dirname}/../data/titans.db`);
const router = express.Router();

router.get("/", (req, res) => {
  try {
    const logs = db.prepare("SELECT * FROM logs ").all();
    if (req.query.action === "created") {
      const createdlogs = db
        .prepare("SELECT * FROM logs WHERE action = ?")
        .all(req.query.action);
      res.json(createdlogs);
    } else {
      res.json(logs);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

module.exports = router;
