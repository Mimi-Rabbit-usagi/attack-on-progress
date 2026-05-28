function validateTitanPatch(req, res, next) {
  if (req.body.size && Number.isNaN(parseInt(req.body.size))) {
    return res.status(400).json("sizeは数値で入力してください");
  }
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json("更新するデータを入力してください。");
  }
  next();
}

module.exports = validateTitanPatch;
