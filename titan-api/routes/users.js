const express = require("express");
const Database = require("better-sqlite3");
const bcrypt = require("bcrypt");
const db = new Database(`${__dirname}/../data/titans.db`);
const router = express.Router();
const validateUserPatch = require("../middleware/validateUserPatch");
const authenticate = require("../middleware/authenticate");

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

router.post("/", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const addUser = db.transaction(() => {
      const result = db
        .prepare(
          "INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, ?)",
        )
        .run(name, email, hashedPassword, new Date().toISOString());

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

router.patch("/:id", authenticate, validateUserPatch, async (req, res) => {
  try {
    const { password } = req.body;
    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    if (req.user.id !== Number(req.params.id)) {
      return res.status(403).json("権限がありません。");
    }

    const updateUser = db.transaction(() => {
      const allowedFields = ["name", "email", "password"];
      const updates = Object.fromEntries(
        Object.entries(req.body).filter(([key]) => allowedFields.includes(key)),
      );
      if (updates.password) {
        updates.password = hashedPassword;
      }
      const setClauses = Object.keys(updates).map((key) => `${key}=?`);
      const values = Object.values(updates);

      const result = db
        .prepare(`UPDATE users SET ${setClauses.join(",")} WHERE id=?`)
        .run(...values, req.params.id);
      if (result.changes === 0) {
        return res.status(404).json(`${req.params.id}は見つかりません`);
      }
      const updatedUser = db
        .prepare("SELECT id, name, email, created_at FROM users WHERE id = ?")
        .get(req.params.id);

      res.json(updatedUser);
    });
    return updateUser();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.delete("/:id", authenticate, (req, res) => {
  try {
    if (req.user.id !== Number(req.params.id)) {
      return res.status(403).json("権限がありません。");
    }

    const deleteUser = db.transaction(() => {
      const user = db
        .prepare("SELECT id FROM users WHERE id = ?")
        .get(req.params.id);
      if (!user) {
        return res.status(404).json(`${req.params.id}は見つかりません`);
      }
      db.prepare("DELETE FROM users WHERE id=?").run(req.params.id);
      res.json("削除しました");
    });

    return deleteUser();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

module.exports = router;
