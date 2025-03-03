const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");

const app = express();
const PORT = 3000;
const USERS_FILE = "users.json";

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));


try {
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify([]));
    }
} catch (error) {
    console.error("Error initializing users file:", error.message);
}


const readUsers = () => {
    try {
        const data = fs.readFileSync(USERS_FILE, "utf8");
        return JSON.parse(data);
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

app.get("/", (req, res) => {
    try {
        const users = readUsers();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});


app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "register.html"));
});


app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
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
        console.error("Error in checkUserExists middleware:", error.message);
        res.status(500).json({ message: "Server error" });
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
        users.push({ username, password: hashedPassword });

        writeUsers(users);
        res.status(201).json({ message: "Registration successful" });
    } catch (error) {
        console.error("Error registering user:", error.message);
        res.status(500).json({ message: "Server error" });
    }
});


app.post("/login", checkUserExists, (req, res) => {
    try {
        res.json({ message: "Login successful", redirect: "/welcome" });
    } catch (error) {
        console.error("Error in login route:", error.message);
        res.status(500).json({ message: "Server error" });
    }
});


app.get("/welcome", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "welcome.html"));
});


app.use((err, req, res, next) => {
    console.error("Unhandled error:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
});


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
