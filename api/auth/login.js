import express from 'express';
import bcrypt from 'bcryptjs';
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

async function getLoginSchema() {
  try {
    const { loginSchema } = await import('../../shared/schema.js');
    return loginSchema;
  } catch (error) {
    console.error('Failed to import schema:', error);
    // Fallback validation
    return {
      parse: (data) => {
        if (!data.username || !data.password) {
          throw new Error('Username and password are required');
        }
        return data;
      }
    };
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
    console.log('Login request received:', req.body);
    
    const storage = await getStorage();
    const loginSchema = await getLoginSchema();
    
    const { username, password, rememberMe } = loginSchema.parse(req.body);
    
    const admin = await storage.getAdminUserByUsername(username);
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Update last login
    await storage.updateLastLogin(admin.id);

    // Set session
    req.session.adminId = admin.id;
    req.session.username = admin.username;

    if (rememberMe) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    }

    console.log('Login successful for user:', username);
    
    res.json({ 
      message: "Login successful",
      user: {
        id: admin.id,
        username: admin.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ message: error.message });
  }
}
