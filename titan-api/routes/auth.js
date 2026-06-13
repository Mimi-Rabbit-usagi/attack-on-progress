const express = require("express");
const Database = require("better-sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = new Database(`${__dirname}/../data/titans.db`);
const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db
      .prepare("SELECT id, email, password FROM users WHERE email = ?")
      .get(email);

    if (!user) {
      res
        .status(401)
        .json({ error: "このメールアドレスは登録されておりません。" });
      return;
    }
    const comparePassword = await bcrypt.compare(password, user.password);
    if (!comparePassword) {
      res
        .status(401)
        .json({ error: "メールアドレスまたはパスワードが間違っております。" });
      return;
    }
    const token = jwt.sign({ id: user.id }, "titan_secret", {
      expiresIn: "1h",
    });
    res.json({ token });
    return;
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

router.post("/logout", (req, res) => {
  try {
    res.json({ message: "ログアウトしました" });
    return;
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
});

module.exports = router;
