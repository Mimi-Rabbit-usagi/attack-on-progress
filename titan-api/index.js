const express = require("express");
const titansRouter = require("./routes/titans");
const usersRouter = require("./routes/users");
const logsRouter = require("./routes/logs");
const authRouter = require("./routes/auth");
const app = express();
const port = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello Titan");
});

app.use("/titans", titansRouter);
app.use("/users", usersRouter);
app.use("/logs", logsRouter);
app.use("/auth", authRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
