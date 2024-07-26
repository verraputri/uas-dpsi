const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
const router = express.Router();

// JWT secret key
const JWT_SECRET = 'your_secret_key';

// Middleware to verify JWT
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }

      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// User registration route
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send('Username and password are required');
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.tinsert('users', { username, password: hashedPassword });

    res.status(201).send('User registered successfully');
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).send('Internal server error');
  }
});

// User login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send('Username and password are required');
  }

  try {
    const [user] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

    if (!user) {
      return res.status(401).send('Username or password incorrect');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).send('Username or password incorrect');
    }

    const accessToken = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });

    res.json({
      accessToken
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).send('Internal server error');
  }
});

router.get('/', authenticateJWT, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM dat_sensor WHERE is_deleted = 0 ORDER BY tgl_terima DESC LIMIT 1');
    res.json(result);
  } catch (e) {
    console.log('Error:', e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/', authenticateJWT, async (req, res) => {
  const data = req.body;
  try {
    let where = [];
    let values = [];
    where.push('is_deleted = 1');
    if (Object.keys(data).length === 0) {
      where.push('1=1');
    } else {
      if (data.tgl_mulai && data.tgl_akhir) {
        where.push('tgl_terima BETWEEN ? AND ?');
        values.push(data.tgl_mulai, data.tgl_akhir);
      }
      if (data.sumber) {
        where.push(`sumber LIKE ?`);
        values.push(`%${data.sumber}%`);
      }
    }
    where = where.join(' AND ');
    const result = await db.query(`SELECT * FROM dat_sensor WHERE ${where}`, values);
    res.json(result);
  } catch (e) {
    console.log('Error:', e);
    res.status(500).json({ error: 'Format filter salah' });
  }
});

router.get('/pompa', authenticateJWT, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM dat_pompa WHERE is_deleted = 0 ORDER BY tgl_terima DESC LIMIT 1');
    res.json(result);
  } catch (e) {
    console.log('Error:', e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/pompa', authenticateJWT, (req, res) => {
  const data = req.body;
  try {
    req.mqttClient.publish('/plantix/pompa', data.pompa);
    res.json('berhasil');
  } catch (e) {
    console.log('Error:', e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/publish/:topic/:message', authenticateJWT, (req, res) => {
  const { topic, message } = req.params;
  req.mqttClient.publish('/plantix/' + topic, message);
  res.send(`Published to topic ${topic}: ${message}`);
});

router.post('/publish/:topic', authenticateJWT, (req, res) => {
  const { topic } = req.params;
  const data = req.body;
  req.mqttClient.publish('/plantix/' + topic, JSON.stringify(data));
  console.log('Data yang diterima:', data);
  res.status(200).json({ message: 'Data berhasil diterima!' });
});

router.use((req, res) => {
  res.status(404).send('404 Not Found');
});

module.exports = router;
