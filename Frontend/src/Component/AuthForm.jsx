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
      ? 'http://localhost:3000/api/users/login'
      : 'http://localhost:3000/api/users/signup';

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
