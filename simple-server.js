const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const fs = require('fs');

const app = express();
const PORT = 3000;

const USERS_FILE = path.join(__dirname, 'users.json');

// In-memory user store for demo purposes
const users = new Map();

// Load users from file on startup
function loadUsers() {
  if (fs.existsSync(USERS_FILE)) {
    try {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      const userArray = JSON.parse(data);
      userArray.forEach(user => {
        users.set(user.username, { email: user.email, password: user.password });
      });
      console.log(`Loaded ${userArray.length} users from file.`);
    } catch (err) {
      console.error('Error loading users from file:', err);
    }
  } else {
    console.log('No users file found, starting with empty user store.');
  }
}

// Save users to file
function saveUsers() {
  const userArray = [];
  for (const [username, data] of users.entries()) {
    userArray.push({ username, email: data.email, password: data.password });
  }
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(userArray, null, 2));
    console.log('Users saved to file.');
  } catch (err) {
    console.error('Error saving users to file:', err);
  }
}

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '')));

// Load users on server start
loadUsers();

// Signup route
app.post('/signup', async (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password) {
    return res.status(400).send('Username and password are required');
  }
  if (users.has(username)) {
    return res.status(400).send('Username already exists');
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    users.set(username, { email, password: hashedPassword });
    saveUsers();
    console.log('User signed up:');
    console.log(`  Username: ${username}`);
    console.log(`  Email: ${email}`);
    console.log(`  Hashed Password: ${hashedPassword}`);
    res.status(201).send('Sign up successful!');
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).send('Server error');
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send('Username and password are required');
  }
  const user = users.get(username);
  if (!user) {
    return res.status(400).send('User not found');
  }
  try {
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      console.log('User logged in:');
      console.log(`  Username: ${username}`);
      console.log(`  Email: ${user.email}`);
      res.status(200).send('Login successful!');
    } else {
      res.status(401).send('Incorrect password');
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Server error');
  }
});

// Route to retrieve user data (excluding passwords)
app.get('/users', (req, res) => {
  console.log('GET /users called');
  const userList = [];
  for (const [username, data] of users.entries()) {
    userList.push({
      username,
      email: data.email
    });
  }
  console.log('Sending user list:', userList);
  res.json(userList);
});

// Serve the auth.html file for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'auth.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
