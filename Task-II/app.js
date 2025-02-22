const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;


app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});


app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));


if (!fs.existsSync('tasks.json')) {
    fs.writeFileSync('tasks.json', '[]');
}


const loadTasks = () => {
    try {
        return JSON.parse(fs.readFileSync('tasks.json', 'utf8'));
    } catch (error) {
        console.error("Error loading tasks:", error);
        return [];
    }
};


const saveTasks = (tasks) => {
    try {
        fs.writeFileSync('tasks.json', JSON.stringify(tasks, null, 2));
    } catch (error) {
        console.error("Error saving tasks:", error);
    }
};


app.get('/tasks', (req, res) => {
    const tasks = loadTasks();
    res.render('tasks', { tasks });
});


app.get('/task', (req, res) => {
    const taskId = parseInt(req.query.id);
    if (isNaN(taskId)) {
        return res.status(400).send("<h2>Invalid Task ID</h2><a href='/tasks'>Back to Tasks</a>");
    }

    const tasks = loadTasks();
    const task = tasks.find(t => t.id === taskId);

    if (!task) {
        return res.status(404).send("<h2>Task Not Found</h2><a href='/tasks'>Back to Tasks</a>");
    }

    res.render('task', { task });
});


app.get('/add-task', (req, res) => {
    res.render('addTask');
});


app.post('/add-task', (req, res) => {
    const { title, description } = req.body;

    if (!title || !description) {
        return res.status(400).send("<h2>Title and Description are required</h2><a href='/add-task'>Back to Add Task</a>");
    }

    const tasks = loadTasks();
    const newTask = {
        id: tasks.length > 0 ? tasks[tasks.length - 1].id + 1 : 1,
        title: title.trim(),
        description: description.trim()
    };

    tasks.push(newTask);
    saveTasks(tasks);
    res.redirect('/tasks');
});


app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
