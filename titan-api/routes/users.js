const express = require("express");
const Database = require("better-sqlite3");
const db = new Database(`${__dirname}/../data/titans.db`);
const router = express.Router();

router.get("/:id", (req, res) => {
  try {
    const user = db
      .prepare("SELECT id, name, email, created_at FROM users WHERE id = ?")
      .get(req.params.id);
    if (user) {
      return res.json(user);
    } else {
      return res.status(404).json(`${req.params.id}は見つかりません`);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.post("/", (req, res) => {
  try {
    const addUser = db.transaction(() => {
      const { name, email, password } = req.body;
      const result = db
        .prepare(
          "INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, ?)",
        )
        .run(name, email, password, new Date().toISOString());

      const newUser = db
        .prepare("SELECT id, name, email, created_at FROM users WHERE id = ?")
        .get(result.lastInsertRowid);
      return newUser;
    });
    const newUser = addUser();
    res.status(201).json(newUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

module.exports = router;
