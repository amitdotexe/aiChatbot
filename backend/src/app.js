const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoute = require("./routes/auth.route");
const chatRoute = require("./routes/chat.route");

const app = express();

// Middlewares
// cors must be registered on the app instance, not in server.js after the
// app object has already been created — registering it there has no effect.
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to the GPT Clone API");
});

app.use("/api/auth", authRoute);
app.use("/api/chat", chatRoute);

module.exports = app;
