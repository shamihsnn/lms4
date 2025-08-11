import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Session info request - Session ID:', req.sessionID);
    console.log('Session info request - Admin ID:', req.session?.adminId);
    console.log('Session info request - Full session:', req.session);
    
    res.json({
      sessionId: req.sessionID,
      adminId: req.session?.adminId || null,
      username: req.session?.username || null,
      hasSession: !!req.session,
      isAuthenticated: !!(req.session && req.session.adminId)
    });
  } catch (error) {
    console.error('Session info error:', error);
    res.status(500).json({ message: error.message });
  }
}
