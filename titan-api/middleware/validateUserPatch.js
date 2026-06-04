function validateUserPatch(req, res, next) {
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json("更新するデータを入力してください。");
  }

  if (req.body.password && req.body.password.length < 8) {
    return res.status(400).json("パスワードは8文字以上で入力してください");
  }

  if (
    req.body.email &&
    (!req.body.email.includes("@") || !req.body.email.includes("."))
  ) {
    return res.status(400).json("メールアドレスには@が必要です");
  }

  next();
}

module.exports = validateUserPatch;
