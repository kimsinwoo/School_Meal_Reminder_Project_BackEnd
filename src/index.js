const express = require("express");
const app = express();
require("dotenv").config();
const authRoutes = require("./routes/authRoutes");
const diaryImageRoutes = require("./routes/diaryImageRoutes");
const cors = require("cors");

const port = process.env.PORT;

app.use(
  cors({
    origin: "http://localhost:3000", 
    methods: ["GET", "POST", "PUT", "DELETE"], 
    credentials: true, 
  })
);

app.use(express.json());

app.use("/auth", authRoutes);   

app.listen(port, () => {
  console.log(`서버가 실행되었습니다. http://localhost:${port}`);
});
