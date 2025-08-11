import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// Dynamic imports to handle both development and production
async function getStorage() {
  try {
    const { SupabaseStorage } = await import('../../dist/server/supabase-storage.js');
    return new SupabaseStorage();
  } catch (error) {
    console.log('Failed to import from dist, trying direct import:', error.message);
    const { SupabaseStorage } = await import('../../server/supabase-storage.js');
    return new SupabaseStorage();
  }
}

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
    console.log('Auth check - Session ID:', req.sessionID);
    console.log('Auth check - Admin ID:', req.session?.adminId);
    
    if (!req.session || !req.session.adminId) {
      console.log('Authentication failed - no valid session');
      return res.status(401).json({ message: "Authentication required" });
    }

    const storage = await getStorage();
    const admin = await storage.getAdminUser(req.session.adminId);
    if (!admin) {
      return res.status(401).json({ message: "User not found" });
    }

    res.json({
      id: admin.id,
      username: admin.username
    });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({ message: error.message });
  }
}
