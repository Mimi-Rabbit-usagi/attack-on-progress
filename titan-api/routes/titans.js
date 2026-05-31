const express = require("express");
const router = express.Router();
const Database = require("better-sqlite3");
const db = new Database(`${__dirname}/../data/titans.db`);
const validateTitan = require("../middleware/validateTitan");
const validateTitanPatch = require("../middleware/validateTitanPatch");

router.get("/", (req, res) => {
  try {
    const { type, minSize, maxSize } = req.query;

    let query = "SELECT * FROM titans WHERE 1=1";
    const params = [];

    if (type !== undefined) {
      query += " AND type = ?";
      params.push(type);
    }
    if (minSize !== undefined) {
      query += " AND size >= ?";
      params.push(Number(minSize));
    }
    if (maxSize !== undefined) {
      query += " AND size <= ?";
      params.push(Number(maxSize));
    }
    const titans = db.prepare(query).all(...params);
    res.json(titans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.get("/summary", (req, res) => {
  try {
    const summary = db
      .prepare("SELECT type, COUNT(*) as count FROM titans GROUP BY type")
      .all();
    return res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.get("/type/:type", (req, res) => {
  try {
    const titans = db
      .prepare("SELECT * FROM titans WHERE type = ?")
      .all(req.params.type);
    res.json(titans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.get("/:id/logs", (req, res) => {
  try {
    const titans = db
      .prepare(
        "SELECT * FROM titans JOIN logs ON titans.id = logs.titan_id WHERE titans.id = ?",
      )
      .all(req.params.id);
    res.json(titans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.get("/:id", (req, res) => {
  try {
    const titan = db
      .prepare("SELECT * FROM titans WHERE id = ?")
      .get(req.params.id);
    if (titan) {
      return res.json(titan);
    } else {
      return res.status(404).json(`${req.params.id}は見つかりません`);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.post("/", validateTitan, (req, res) => {
  try {
    const addTitan = db.transaction(() => {
      const { name, size, type, ability } = req.body;
      const result = db
        .prepare(
          "INSERT INTO titans (name, size, type, ability) VALUES (?, ?, ?, ?)",
        )
        .run(name, size, type, ability);
      const logs = db
        .prepare(
          "INSERT INTO logs (action, titan_id, status,created_at) VALUES(?, ?, ?, ?)",
        )
        .run(
          "created",
          result.lastInsertRowid,
          "success",
          new Date().toISOString(),
        );
      const newTitan = db
        .prepare("SELECT * FROM titans WHERE id = ?")
        .get(result.lastInsertRowid);
      return newTitan;
    });
    const newTitan = addTitan();
    res.status(201).json(newTitan);
  } catch (err) {
    console.error(err);
    const logs = db
      .prepare(
        "INSERT INTO logs (action, titan_id, status,created_at) VALUES(?, ?, ?, ?)",
      )
      .run("error", null, "failed", new Date().toISOString());
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.put("/:id", validateTitan, (req, res) => {
  try {
    const updateTitan = db.transaction(() => {
      const { name, size, type, ability } = req.body;
      const result = db
        .prepare(
          "UPDATE titans SET name=?, size=?, type=?, ability=? WHERE id=?",
        )
        .run(name, size, type, ability, req.params.id);
      if (result.changes === 0) {
        return res.status(404).json(`${req.params.id}は見つかりません`);
      }
      const logs = db
        .prepare(
          "INSERT INTO logs (action, titan_id, status,created_at) VALUES(?, ?, ?, ?)",
        )
        .run("updated", req.params.id, "success", new Date().toISOString());
      const updatedTitan = db
        .prepare("SELECT * FROM titans WHERE id = ?")
        .get(req.params.id);
      res.json(updatedTitan);
    });
    return updateTitan();
  } catch (err) {
    console.error(err);
    const logs = db
      .prepare(
        "INSERT INTO logs (action, titan_id, status,created_at) VALUES(?, ?, ?, ?)",
      )
      .run("error", req.params.id, "failed", new Date().toISOString());
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.patch("/:id", validateTitanPatch, (req, res) => {
  try {
    const updateTitan = db.transaction(() => {
      const beforeTitan = db.prepare("SELECT * FROM titans WHERE id = ?").get(req.params.id);
      const allowedFields = ["name", "size", "type", "ability"];
      const updates = Object.fromEntries(
        Object.entries(req.body).filter(([key]) => allowedFields.includes(key)),
      );
      const setClauses = Object.keys(updates).map((key) => `${key}=?`);
      const values = Object.values(updates);

      const result = db
        .prepare(`UPDATE titans SET ${setClauses.join(",")} WHERE id=?`)
        .run(...values, req.params.id);
      if (result.changes === 0) {
        return res.status(404).json(`${req.params.id}は見つかりません`);
      }
      const updatedTitan = db
        .prepare("SELECT * FROM titans WHERE id = ?")
        .get(req.params.id);

      const details = Object.keys(updates).map((key)=> `${key}: ${beforeTitan[key]} → ${updatedTitan[key]}`).join(",");

      const logs = db
        .prepare(
          "INSERT INTO logs (action, titan_id, details, status, created_at) VALUES(?, ?, ?, ?, ?)",
        )
        .run("updated",  req.params.id, details,"success", new Date().toISOString());

      res.json(updatedTitan);
    });
    return updateTitan();
  } catch (err) {
    console.error(err);
    const logs = db
      .prepare(
        "INSERT INTO logs (action, titan_id, details, status, created_at) VALUES(?, ?, ?, ?, ?)",
      )
      .run("error", req.params.id, null, "failed", new Date().toISOString());
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.delete("/:id", (req, res) => {
  try {
    const deleteTitan = db.transaction(() => {
      const titan = db
        .prepare("SELECT * FROM titans WHERE id = ?")
        .get(req.params.id);
      if (!titan) {
        return res.status(404).json(`${req.params.id}は見つかりません`);
      }
      db.prepare(
        "INSERT INTO logs (action, titan_id, status, created_at) VALUES(?, ?, ?, ?)",
      ).run("deleted",  titan.id, "success", new Date().toISOString());

      db.prepare("DELETE FROM titans WHERE id=?").run(req.params.id);
      res.json("削除しました");
    });

    return deleteTitan();
  } catch (err) {
    console.error(err);
    const logs = db
      .prepare(
        "INSERT INTO logs (action, titan_id, status,created_at) VALUES(?, ?, ?, ?)",
      )
      .run("error",  req.params.id, "failed", new Date().toISOString());
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

module.exports = router;
