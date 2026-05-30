const express = require("express");
const Database = require("better-sqlite3");
const db = new Database(`${__dirname}/../data/titans.db`);
const router = express.Router();

router.get("/", (req, res) => {
  try {
    if (req.query.action !== undefined) {
      const logs = db
        .prepare("SELECT * FROM logs WHERE action = ?")
        .all(req.query.action);
      return res.json(logs);
    } else {
      const logs = db.prepare("SELECT * FROM logs").all();
      return res.json(logs);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

module.exports = router;
