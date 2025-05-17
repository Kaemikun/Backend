// Rewritten to use Mongoose
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const authRouter = express.Router();

const app = express();
const PORT = 3000;
const MONGO_URI = "mongodb+srv://ansh:lkausha@cluster0.zyhjldv.mongodb.net/musicApp?retryWrites=true&w=majority&appName=Cluster0";

async function startServer() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

startServer();



const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  playlist: { type: Array, default: [] },
});

const User = mongoose.model("User", userSchema,"users");

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/", authRouter);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const limiter = rateLimit({
  windowMs: 5 * 1000,
  max: 5,
  handler: (req, res) => {
    res.status(429).render("page.ejs");
  },
});

authRouter.use((req, res, next) => {
  console.log(`[Router middleware] ${req.method} ${req.originalUrl} at ${new Date().toISOString()}`);
  next();
});

app.use("/login", limiter);

app.get("/", (req, res) => res.render("welcome.ejs"));
app.get("/register", (req, res) => res.render("register.ejs"));
app.get("/login", (req, res) => res.render("login.ejs"));

const API_KEY = "403332dfa7msh96da11df59bcc06p1cfa2djsn8f922da14d6f";
const API_HOST = "deezerdevs-deezer.p.rapidapi.com";

async function searchSongs(query) {
  if (!query) return { error: "Missing search query" };

  const url = `https://deezerdevs-deezer.p.rapidapi.com/search?q=${encodeURIComponent(query)}`;
  const options = {
    method: "GET",
    headers: {
      "x-rapidapi-key": API_KEY,
      "x-rapidapi-host": API_HOST,
    },
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching songs:", error);
    return { error: "Failed to fetch songs" };
  }
}

app.get("/api/search", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Missing search query" });
  const data = await searchSongs(query);
  res.json(data);
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: "Username and password are required" });

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashedPassword });

    res.status(201).json({ message: "Registration successful" });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Server error" });
  }
});



const checkUserExists = async (req, res, next) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: "Missing username or password" });

  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

app.post("/login", checkUserExists, (req, res) => {
  res.json({ message: "Login successful", redirect: "/" });
});


app.get("/api/get-playlist", async (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).json({ message: "Username is required" });

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ playlist: user.playlist || [] });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/save-playlist", async (req, res) => {
  const { username, playlist } = req.body;
  if (!username || !playlist) return res.status(400).json({ message: "Invalid data" });

  try {
    const result = await User.updateOne({ username }, { $set: { playlist } });
    if (result.matchedCount === 0) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Playlist saved successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/add-song", async (req, res) => {
  const { username, song } = req.body;
  if (!username || !song) return res.status(400).json({ message: "Invalid data" });

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    const exists = user.playlist.some(s => s.id === song.id);
    if (!exists) {
      user.playlist.push(song);
      await user.save();
    }

    res.json({ message: "Song added successfully!", playlist: user.playlist });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/remove-song", async (req, res) => {
  const { username, id } = req.body;
  if (!username || !id) return res.status(400).json({ message: "Invalid request data" });

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.playlist = user.playlist.filter(song => song.id !== id);
    await user.save();

    res.json({ message: "Song removed successfully", playlist: user.playlist });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("*", (req, res, next) => {
  const err = new Error("Page not found");
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).render("404.ejs");
});
