# MERN Auth Guide — Login & Signup (MongoDB)
> Sabse simple explanation — DB connection, Model, Routes, aur Frontend form sab ek jagah

---

## Project Structure (Pehle yeh banao)

```
TechandTomorrow/
├── Backend/
│   ├── api/
│   │   ├── config/
│   │   │   └── db.js          ← MongoDB se connect karta hai
│   │   ├── models/
│   │   │   └── User.js        ← User ka template (kya save hoga)
│   │   └── routes/
│   │       └── authRoutes.js  ← Signup/Login ka kaam
│   ├── .env                   ← Secrets (MongoDB link, JWT key)
│   ├── server.js              ← Main entry point
│   └── package.json
│
└── Frontend/
    └── src/
        ├── App.jsx
        └── components/
            └── AuthForm.jsx   ← Signup + Login form
```

---

## Step 1 — Packages Install Karo

```bash
# Backend folder mein jao
cd Backend

# Yeh 4 packages chahiye
npm install express mongoose bcryptjs jsonwebtoken dotenv cors
```

| Package | Kya karta hai |
|---|---|
| `express` | Server banata hai |
| `mongoose` | MongoDB se baat karta hai |
| `bcryptjs` | Password encrypt karta hai |
| `jsonwebtoken` | Login token banata hai |
| `dotenv` | `.env` file read karta hai |
| `cors` | Frontend ko backend se baat karne deta hai |

---

## Step 2 — .env File

```
# Backend/.env

MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/myapp
JWT_SECRET=kuchbhilambisecretstring123
PORT=5000
```

> ⚠️ `.env` file kabhi GitHub pe push mat karo — `.gitignore` mein add karo

---

## Step 3 — DB Connection (`api/config/db.js`)

```js
// db.js ka ek kaam hai — MongoDB se connect karna
// Yeh ek baar server start hone pe chalta hai

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // MONGO_URI .env se aata hai
    const conn = await mongoose.connect(process.env.MONGO_URI);

    // Connected! Host name print karo
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

  } catch (error) {
    // Kuch gadbad hui toh error print karo aur server band karo
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1); // Server band karo
  }
};

module.exports = connectDB;
```

**Yeh file kya karti hai?**
- MongoDB ka door kholti hai
- Agar connection fail ho toh server ruk jaata hai
- Sirf ek baar call hoti hai — `server.js` mein

---

## Step 4 — User Model (`api/models/User.js`)

```js
// Model = MongoDB ko batana ki user ka data kaisa dikhega
// Jaise ek form template — sirf yahi fields allowed hain

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,       // Yeh field zaroor chahiye
      trim: true,           // Extra spaces hata do
    },

    email: {
      type: String,
      required: true,
      unique: true,         // Ek email sirf ek baar use ho sakti hai
      lowercase: true,      // Hamesha lowercase mein save karo
    },

    password: {
      type: String,
      required: true,
      minlength: 6,         // Minimum 6 characters
    },
  },
  {
    timestamps: true,       // Auto: createdAt aur updatedAt add ho jaata hai
  }
);

// 'User' naam se MongoDB mein 'users' collection banega
module.exports = mongoose.model('User', userSchema);
```

**Model ka fayda kya hai?**
- Galat data save nahi hoga
- `unique: true` = duplicate email block
- `required: true` = empty fields block

---

## Step 5 — Auth Routes (`api/routes/authRoutes.js`)

```js
// Routes = URLs pe kya kaam hoga
// POST /api/signup → account banao
// POST /api/login  → login karo

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Model import karo

// ─────────────────────────────────────────────
// SIGNUP ROUTE — POST /api/signup
// ─────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    // 1. Frontend se data nikalo
    const { name, email, password } = req.body;

    // 2. Sab fields hain?
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Sab fields fill karo' });
    }

    // 3. Email pehle se registered hai?
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already use mein hai' });
    }

    // 4. Password encrypt karo (kabhi plain text save mat karo!)
    //    10 = kitna strong encryption (higher = slower but safer)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. User MongoDB mein save karo
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword, // Original nahi, encrypted save hoga
    });

    // 6. Success response bhejo
    res.status(201).json({
      message: 'Account ban gaya!',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        // password kabhi response mein mat bhejo!
      },
    });

  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// ─────────────────────────────────────────────
// LOGIN ROUTE — POST /api/login
// ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    // 1. Frontend se email aur password lo
    const { email, password } = req.body;

    // 2. Email se user dhoondo MongoDB mein
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Email nahi mila' });
    }

    // 3. Password match karo
    //    bcrypt.compare(jo diya, jo database mein hai)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Password galat hai' });
    }

    // 4. JWT Token banao (yeh proof hai ki user logged in hai)
    //    jwt.sign(data, secret, options)
    const token = jwt.sign(
      { id: user._id, email: user.email }, // Token mein kya store karna hai
      process.env.JWT_SECRET,              // Secret key (.env se)
      { expiresIn: '7d' }                  // Token 7 din baad expire hoga
    );

    // 5. Token aur user info bhejo
    res.json({
      message: 'Login ho gaya!',
      token, // Frontend isko localStorage mein save karega
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

module.exports = router;
```

---

## Step 6 — Main Server (`server.js`)

```js
// server.js = Puri app ka starting point
// Sab kuch yahan se shuru hota hai

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./api/config/db');      // DB connection
const authRoutes = require('./api/routes/authRoutes'); // Routes

// .env file load karo (SABSE PEHLE)
dotenv.config();

// MongoDB se connect karo
connectDB();

// Express app banao
const app = express();

// ─── MIDDLEWARE ───────────────────────────────
// Middleware = har request ke beech mein chalne wala kaam

app.use(cors()); 
// cors = Frontend (localhost:5173) ko Backend (localhost:5000) se baat karne deta hai

app.use(express.json());
// express.json = Request body JSON mein read karna enable karo

// ─── ROUTES ──────────────────────────────────
// /api/signup aur /api/login yahan connect hote hain
app.use('/api', authRoutes);

// Test route — browser mein check karo
app.get('/', (req, res) => {
  res.json({ message: 'Server chal raha hai! 🚀' });
});

// ─── SERVER START ─────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server chal raha hai: http://localhost:${PORT}`);
});
```

---

## Step 7 — Frontend Form (`src/components/AuthForm.jsx`)

```jsx
// AuthForm.jsx — Ek component mein Login + Signup dono

import { useState } from 'react';

function AuthForm() {
  // ─── STATE ──────────────────────────────────
  // isLogin = true  → Login form dikhao
  // isLogin = false → Signup form dikhao
  const [isLogin, setIsLogin] = useState(false);

  // Form ke inputs yahan store hote hain
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  // Server se jo message aaya woh dikhao
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  // ─── INPUT HANDLER ───────────────────────────
  // Jab bhi koi field type kare, state update karo
  const handleChange = (e) => {
    setFormData({
      ...formData,           // Baaki fields rakhna (spread)
      [e.target.name]: e.target.value, // Sirf yeh wali update karo
    });
  };

  // ─── FORM SUBMIT ─────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault(); // Page reload mat karo
    setLoading(true);
    setMessage('');

    // Kaunsi URL call karni hai?
    const url = isLogin
      ? 'http://localhost:5000/api/login'
      : 'http://localhost:5000/api/signup';

    // Signup mein naam bhi bhejo, login mein sirf email+pass
    const body = isLogin
      ? { email: formData.email, password: formData.password }
      : formData; // name, email, password sab

    try {
      // Backend ko POST request bhejo
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body), // JS object → JSON string
      });

      // Response parse karo
      const data = await response.json();

      if (data.error) {
        // Error aaya
        setMessage(data.error);
        setIsError(true);
      } else {
        // Success!
        setMessage(data.message);
        setIsError(false);

        // Login ke baad token save karo
        if (isLogin && data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          // Yahan aap dashboard pe redirect kar sakte ho
          // navigate('/dashboard')
        }

        // Form clear karo
        setFormData({ name: '', email: '', password: '' });
      }

    } catch (error) {
      setMessage('Network error — backend chal raha hai?');
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  // ─── RENDER ──────────────────────────────────
  return (
    <div style={styles.container}>
      <div style={styles.card}>

        {/* Title */}
        <h2 style={styles.title}>
          {isLogin ? 'Login' : 'Account Banao'}
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit}>

          {/* Name — sirf signup mein dikhao */}
          {!isLogin && (
            <div style={styles.field}>
              <label style={styles.label}>Name</label>
              <input
                style={styles.input}
                type="text"
                name="name"           // handleChange ke liye zaroori
                value={formData.name}
                onChange={handleChange}
                placeholder="Apna naam likho"
              />
            </div>
          )}

          {/* Email */}
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tumhari@email.com"
            />
          </div>

          {/* Password */}
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Min 6 characters"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'Wait...' : isLogin ? 'Login Karo' : 'Account Banao'}
          </button>
        </form>

        {/* Success / Error Message */}
        {message && (
          <p style={{
            ...styles.message,
            color: isError ? '#c0392b' : '#27ae60',
            background: isError ? '#fdecea' : '#eafaf1',
          }}>
            {message}
          </p>
        )}

        {/* Switch between Login / Signup */}
        <p style={styles.switchText}>
          {isLogin ? 'Account nahi hai? ' : 'Pehle se account hai? '}
          <span
            style={styles.switchLink}
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage('');
            }}
          >
            {isLogin ? 'Signup karo' : 'Login karo'}
          </span>
        </p>

      </div>
    </div>
  );
}

// ─── STYLES ────────────────────────────────────
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f5f5',
    fontFamily: 'sans-serif',
  },
  card: {
    background: 'white',
    padding: '2rem',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  },
  title: {
    fontSize: '22px',
    fontWeight: '600',
    marginBottom: '1.5rem',
    color: '#1a1a1a',
  },
  field: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    color: '#555',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '11px',
    background: '#1a1a1a',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  message: {
    marginTop: '1rem',
    padding: '10px 12px',
    borderRadius: '8px',
    fontSize: '13px',
  },
  switchText: {
    marginTop: '1rem',
    textAlign: 'center',
    fontSize: '13px',
    color: '#666',
  },
  switchLink: {
    color: '#1a1a1a',
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};

export default AuthForm;
```

---

## Step 8 — App.jsx mein Add Karo

```jsx
// src/App.jsx

import AuthForm from './components/AuthForm';

function App() {
  return (
    <div>
      <AuthForm />
    </div>
  );
}

export default App;
```

---

## Step 9 — Dono Start Karo

**Terminal 1 — Backend:**
```bash
cd Backend
node server.js

# Output dikhega:
# ✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
# 🚀 Server chal raha hai: http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd Frontend
npm run dev

# Output dikhega:
# Local: http://localhost:5173
```

---

## Puri Flow — Ek Nazar Mein

```
USER                REACT                 EXPRESS              MONGODB
 |                    |                      |                     |
 | Form Fill karo     |                      |                     |
 |─────────────────→  |                      |                     |
 |                    | POST /api/signup     |                     |
 |                    |─────────────────────→|                     |
 |                    |                      | Email check karo    |
 |                    |                      |────────────────────→|
 |                    |                      |← User nahi mila     |
 |                    |                      | Password hash karo  |
 |                    |                      | User save karo      |
 |                    |                      |────────────────────→|
 |                    |                      |← Saved!             |
 |                    |← { message: "Done" } |                     |
 | "Account ban gaya" |                      |                     |
```

---

## Common Errors aur Fix

| Error | Matlab | Fix |
|---|---|---|
| `ECONNREFUSED` | MongoDB connect nahi hua | MONGO_URI check karo |
| `Email already use mein hai` | Duplicate email | Naya email use karo |
| `Cannot POST /api/signup` | Route nahi mila | `server.js` mein `app.use('/api', authRoutes)` check karo |
| `Network Error` | Backend band hai | `node server.js` chala ke dekho |
| `cors error` | Frontend blocked | `app.use(cors())` add karo |

---

## JWT Token — Short Note

Login ke baad `data.token` milta hai. Yeh save karo:

```js
// Save karo
localStorage.setItem('token', data.token);

// Use karo (protected routes ke liye)
const token = localStorage.getItem('token');

// Request mein bhejo
fetch('/api/profile', {
  headers: {
    Authorization: `Bearer ${token}` // "Bearer " + token
  }
});

// Logout
localStorage.removeItem('token');
```

---

*Guide complete hai. Ek baar khud type karo — copy-paste mat karo — samajh aayega!* 🚀
