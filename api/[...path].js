// Vercel catch-all API handler
import express from 'express';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let app;

// Import the compiled routes from the dist directory
async function loadRoutes() {
  try {
    // Try to import from the compiled dist directory first
    const { registerRoutes } = await import('../dist/server/routes.js');
    return registerRoutes;
  } catch (error) {
    console.log('Failed to import from dist, trying direct import:', error.message);
    try {
      // Fallback to direct import (for development)
      const { registerRoutes } = await import('../server/routes.js');
      return registerRoutes;
    } catch (fallbackError) {
      console.error('Failed to import routes:', fallbackError);
      throw new Error('Could not load routes module');
    }
  }
}

export default async function handler(req, res) {
  try {
    if (!app) {
      console.log('Initializing Express app for Vercel...');
      
      // Initialize the Express app on first request
      app = express();
      
      // Trust proxy headers (important for Vercel)
      app.set('trust proxy', 1);
      
      // Middleware
      app.use(express.json({ limit: '10mb' }));
      app.use(express.urlencoded({ extended: false, limit: '10mb' }));
      
      // Disable ETag/conditional caching for dynamic API responses
      app.set("etag", false);
      app.use("/api", (_req, res, next) => {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.setHeader("Surrogate-Control", "no-store");
        next();
      });
      
      // Load and register all routes
      const registerRoutes = await loadRoutes();
      await registerRoutes(app);
      
      console.log('Express app initialized successfully');
    }
    
    // Reconstruct the original URL path
    const pathArray = req.query.path || [];
    const originalUrl = `/api/${Array.isArray(pathArray) ? pathArray.join('/') : pathArray}`;
    
    console.log(`Processing request: ${req.method} ${originalUrl}`);
    
    // Create a new request object with the correct URL
    req.url = originalUrl;
    req.originalUrl = originalUrl;
    req.path = originalUrl;
    
    // Add CORS headers for cross-origin requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Handle the request
    app(req, res);
  } catch (error) {
    console.error('API Handler Error:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
