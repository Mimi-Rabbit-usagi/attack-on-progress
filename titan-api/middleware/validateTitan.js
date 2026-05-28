function validateTitan(req, res, next) {
  const { name, size, type, ability } = req.body;
  if (!name || !size || !type || !ability) {
    return res.status(400).json("name,size,type,abilityは必須です");
  }
  if (req.body.size && Number.isNaN(parseInt(req.body.size))) {
    return res.status(400).json("sizeは数値で入力してください");
  }
  next();
}

module.exports = validateTitan;
