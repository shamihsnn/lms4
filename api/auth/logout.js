import express from 'express';
import session from 'express-session';

// Create Express app for this endpoint
const app = express();

// Session configuration
const isProduction = process.env.NODE_ENV === 'production';
const useSecureCookie = isProduction || (process.env.COOKIE_SECURE || "false").toLowerCase() === "true";

const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'lab-management-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: useSecureCookie,
    sameSite: useSecureCookie ? 'none' : 'lax',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

app.set('trust proxy', 1);
app.use(express.json());
app.use(session(sessionConfig));

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Logout request - Session ID:', req.sessionID);
    
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ message: "Could not log out" });
      }
      
      res.clearCookie('connect.sid');
      res.json({ message: "Logged out successfully" });
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: error.message });
  }
}
