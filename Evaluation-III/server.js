const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cors = require("cors");
const app = express();
const PORT = 3000;
const USERS_FILE = "users.json";
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));


const API_KEY = "403332dfa7msh96da11df59bcc06p1cfa2djsn8f922da14d6f";
const API_HOST = "deezerdevs-deezer.p.rapidapi.com";


async function searchSongs(query) {
    if (!query) return { error: "Missing search query" };

    const url = `https://deezerdevs-deezer.p.rapidapi.com/search?q=${encodeURIComponent(query)}`;
    const options = {
        method: "GET",
        headers: {
            "x-rapidapi-key": API_KEY,
            "x-rapidapi-host": API_HOST
        }
    };

    try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);

        const data = await response.json();
        return data;
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


if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}


const readUsers = () => {
    try {
        return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    } catch (error) {
        console.error("Error reading users file:", error.message);
        return [];
    }
};


const writeUsers = (users) => {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error("Error writing to users file:", error.message);
    }
};


app.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        let users = readUsers();

        
        if (users.some(user => user.username === username)) {
            return res.status(400).json({ message: "User already exists" });
        }

        
        const hashedPassword = await bcrypt.hash(password, 10);
        users.push({ username, password: hashedPassword, playlist: [] });

        writeUsers(users);
        res.status(201).json({ message: "Registration successful" });
    } catch (error) {
        console.error("Error registering user:", error.message);
        res.status(500).json({ message: "Server error" });
    }
});


const checkUserExists = (req, res, next) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: "Missing username or password" });
        }

        const users = readUsers();
        const user = users.find(u => u.username === username);

        if (!user) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        bcrypt.compare(password, user.password, (err, match) => {
            if (err) {
                console.error("Error comparing passwords:", err.message);
                return res.status(500).json({ message: "Server error" });
            }

            if (!match) {
                return res.status(401).json({ message: "Invalid username or password" });
            }

            req.user = user;
            next();
        });
    } catch (error) {
        console.error("Error in authentication middleware:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};


app.post("/login", checkUserExists, (req, res) => {
    res.json({ message: "Login successful", redirect: "/welcome", username: req.user.username });
});


app.get("/api/get-playlist", (req, res) => {
    const username = req.query.username;
    if (!username) {
        return res.status(400).json({ message: "Username is required" });
    }

    const users = readUsers();
    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    res.json({ playlist: user.playlist || [] });
});


app.post("/api/save-playlist", (req, res) => {
    const { username, playlist } = req.body;
    if (!username || !playlist) {
        return res.status(400).json({ message: "Invalid data" });
    }

    let users = readUsers();
    let user = users.find(u => u.username === username);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    user.playlist = playlist;
    writeUsers(users);

    res.json({ message: "Playlist saved successfully!" });
});


app.post("/api/add-song", (req, res) => {
    const { username, song } = req.body;
    if (!username || !song) {
        return res.status(400).json({ message: "Invalid data" });
    }

    let users = readUsers();
    let user = users.find(u => u.username === username);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    user.playlist = user.playlist || [];
    if (!user.playlist.some(s => s.id === song.id)) {
        user.playlist.push(song);
    }
    writeUsers(users);

    res.json({ message: "Song added successfully!", playlist: user.playlist });
});


app.post("/api/remove-song", async (req, res) => {
    console.log("Remove song route hit!");

    const { username, id } = req.body;
    console.log(`Searching for user: ${username}`);

    if (!username || !id) {
        return res.status(400).json({ message: "Invalid request data" });
    }

    try {
        let users = JSON.parse(fs.readFileSync("users.json"));
        console.log("Users file loaded");

       
        let userIndex = users.findIndex(user => user.username === username);

        if (userIndex === -1) {
            console.log("User not found:", username);
            return res.status(404).json({ message: "User not found" });
        }

        console.log("Found user:", users[userIndex].username);
        console.log("Playlist before removal:", users[userIndex].playlist);

        
        users[userIndex].playlist = users[userIndex].playlist.filter(song => song.id !== id);

       
        fs.writeFileSync("users.json", JSON.stringify(users, null, 2));

        console.log("Song removed successfully!");
        res.json({ message: "Song removed successfully", playlist: users[userIndex].playlist });
    } catch (error) {
        console.error("Error removing song:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});






// Serve Static Pages
app.get("/register", (req, res) => res.sendFile(path.join(__dirname, "public", "register.html")));
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "public", "login.html")));
app.get("/welcome", (req, res) => res.sendFile(path.join(__dirname, "public", "welcome.html")));

// app.use((req, res, next) => {
//     res.status(404).sendFile(path.join(__dirname, './public/404.html'));
// });
app.get("*", (req, res,next) => {
    const err = new Error("Page not found");
    err.status = 404;
    next(err);
});

// Global Error Handler
app.use((err, req, res, next) => {
    res.sendFile(path.join(__dirname, './public/404.html'));
    // console.error("Unhandled error:", err.message);
    // res.status(500).json({ message: "Internal Server Error" });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
