/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { evaluateRisk } from './src/server/ml-engine.ts';
import {
  createUser,
  deleteAssessment,
  deleteUser,
  findUserByEmail,
  findUserById,
  getAllAssessments,
  getAllUsers,
  getAssessmentById,
  getAssessmentsForUser,
  getSystemStats,
  retrainModelSimulated,
  saveAssessment,
  updateUser,
} from './src/server/db.ts';
import type { AssessmentInput, User } from './src/types.ts';

dotenv.config();

const app = express();

// Enable CORS for remote frontends (e.g. Cloudflare Pages, Vercel, or custom domains)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-pin');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Detect environment:
// In the AI Studio preview container, CONTROL_PLANE_PORT is set to 8000, NGINX_PORT is 8080, and NODE_ENV is 'development'.
// In production Cloud Run, CONTROL_PLANE_PORT is unset, NGINX is not running, and Cloud Run assigns PORT (8080).
const isDev = Boolean(process.env.CONTROL_PLANE_PORT) || process.env.NODE_ENV === 'development';
const isProduction = !isDev;

// Parse command-line args for --port (e.g. `npm run dev --port 3000`)
const portArgIndex = process.argv.indexOf('--port');
const cliPort = portArgIndex !== -1 && process.argv[portArgIndex + 1] ? Number(process.argv[portArgIndex + 1]) : undefined;

let PORT: number;
if (process.env.APP_PORT) {
  PORT = Number(process.env.APP_PORT);
} else if (cliPort) {
  PORT = cliPort;
} else if (isDev) {
  // Local development environment: Nginx is listening on 8080 and forwarding to 3000
  PORT = Number(process.env.DEFAULT_APP_PORT || 3000);
} else {
  // Cloud Run / Production container: listen on process.env.PORT (typically 8080)
  PORT = Number(process.env.PORT || 8080);
}

const JWT_SECRET = process.env.JWT_SECRET || 'womensafe-ai-production-secret-2026-key';
const ADMIN_SECURITY_PIN = process.env.ADMIN_SECURITY_PIN || '260108';

// Standard middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom request interface with authenticated user
interface AuthenticatedRequest extends Request {
  user?: User;
  adminVerified?: boolean;
}

// Auth Middleware
function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: 'user' | 'admin';
      adminVerified?: boolean;
    };
    const user = findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User session invalid or expired' });
    }
    const { password_hash, ...publicUser } = user;
    const isVerified = Boolean(decoded.adminVerified);
    req.user = {
      ...publicUser,
      adminVerified: isVerified,
    };
    req.adminVerified = isVerified;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Optional Auth Middleware (allows guest assessments while linking user if present)
function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        role: 'user' | 'admin';
        adminVerified?: boolean;
      };
      const user = findUserById(decoded.userId);
      if (user) {
        const { password_hash, ...publicUser } = user;
        const isVerified = Boolean(decoded.adminVerified);
        req.user = {
          ...publicUser,
          adminVerified: isVerified,
        };
        req.adminVerified = isVerified;
      }
    } catch {
      // Ignore token error for optional auth
    }
  }
  next();
}

// Admin Gate Middleware - Enforces server-side PIN check before granting admin dashboard access
function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Admin authorization required. Access to the dashboard is restricted to administrators.',
      requiresAdminRole: true,
    });
  }

  // Server-side check: token must carry adminVerified: true, or x-admin-pin header matches configured PIN
  const headerPin = req.headers['x-admin-pin'];
  const isHeaderPinValid = headerPin && String(headerPin).trim() === ADMIN_SECURITY_PIN;
  const isTokenPinVerified = Boolean(req.adminVerified);

  if (!isTokenPinVerified && !isHeaderPinValid) {
    return res.status(403).json({
      error: 'Admin Security PIN verification required to access the dashboard.',
      requiresAdminPin: true,
    });
  }

  next();
}

/* =========================================================================
   REST API ENDPOINTS
   ========================================================================= */

// Healthcheck (handles both /health and /api/health for Cloud Run and internal probes)
app.get(['/health', '/api/health'], (req, res) => {
  res.json({ status: 'ok', service: 'WomenSafe AI API', timestamp: new Date().toISOString() });
});

// 1. Authentication Endpoints
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, role, adminPin } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const requestedRole = (role === 'admin' || Boolean(adminPin)) ? 'admin' : 'user';

    // Enforce Master PIN check for admin registration server-side
    let isAdminVerified = false;
    if (requestedRole === 'admin') {
      if (!adminPin || String(adminPin).trim() !== ADMIN_SECURITY_PIN) {
        return res.status(403).json({
          error: 'Invalid admin credentials.',
          requiresAdminPin: true,
        });
      }
      isAdminVerified = true;
    }

    const existing = findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const user = createUser(name.trim(), email.trim(), passwordHash, requestedRole);

    const token = jwt.sign(
      { userId: user.id, role: user.role, adminVerified: isAdminVerified },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: requestedRole === 'admin' ? 'Admin account created successfully' : 'Registration successful',
      user: { ...user, adminVerified: isAdminVerified },
      token,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to complete registration' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password, adminPin } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = bcrypt.compareSync(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is an admin OR if admin PIN was provided
    let isUserAdmin = user.role === 'admin';
    let isAdminVerified = false;

    if (adminPin) {
      if (String(adminPin).trim() === ADMIN_SECURITY_PIN) {
        isAdminVerified = true;
        if (!isUserAdmin) {
          updateUser(user.id, { role: 'admin' });
          isUserAdmin = true;
        }
      } else {
        return res.status(403).json({
          error: 'Invalid admin credentials.',
          requiresAdminPin: true,
        });
      }
    }

    const role = isUserAdmin ? 'admin' : 'user';
    const token = jwt.sign(
      { userId: user.id, role, adminVerified: isAdminVerified },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    const { password_hash, ...publicUser } = user;
    const finalUser = { ...publicUser, role, adminVerified: isAdminVerified };

    res.json({
      message: isUserAdmin ? 'Admin login verified successfully' : 'Login successful',
      user: finalUser,
      token,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to authenticate user' });
  }
});

// Admin PIN check endpoint - Validates PIN server-side and issues elevated admin token
app.post('/api/auth/verify-admin-pin', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { pin } = req.body;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!pin) {
      return res.status(400).json({ valid: false, error: 'Security PIN is required' });
    }

    const isValid = String(pin).trim() === ADMIN_SECURITY_PIN;
    if (!isValid) {
      return res.status(403).json({
        valid: false,
        error: 'Invalid admin credentials.',
      });
    }

    let elevatedUser: User | undefined;
    let elevatedToken: string | undefined;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: 'user' | 'admin' };
        const storedUser = findUserById(decoded.userId);
        if (storedUser) {
          const updated = updateUser(storedUser.id, { role: 'admin' });
          const baseUser = updated || {
            id: storedUser.id,
            name: storedUser.name,
            email: storedUser.email,
            role: 'admin' as const,
            created_at: storedUser.created_at,
          };
          elevatedUser = { ...baseUser, role: 'admin', adminVerified: true };
          elevatedToken = jwt.sign(
            { userId: elevatedUser.id, role: 'admin', adminVerified: true },
            JWT_SECRET,
            { expiresIn: '7d' }
          );
        }
      } catch {
        // Token expired or invalid
      }
    }

    return res.json({
      valid: true,
      success: true,
      message: 'Admin authorization verified successfully.',
      user: elevatedUser,
      token: elevatedToken,
    });
  } catch (err: any) {
    console.error('Verify PIN error:', err);
    res.status(500).json({ error: 'Failed to verify admin PIN' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/me', authenticateToken, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

// Update Profile (Name, Email, Password) - Available for both Admin and standard users
app.put('/api/auth/profile', authenticateToken, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { name, email, password } = req.body;

    if (!name && !email && !password) {
      return res.status(400).json({ error: 'No profile updates provided' });
    }

    // Check if new email is already taken by another account
    if (email && email.trim().toLowerCase() !== req.user!.email.toLowerCase()) {
      const existing = findUserByEmail(email.trim());
      if (existing && existing.id !== userId) {
        return res.status(409).json({ error: 'This email is already associated with another account' });
      }
    }

    let passwordHash: string | undefined;
    if (password && password.trim().length > 0) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }
      const salt = bcrypt.genSaltSync(10);
      passwordHash = bcrypt.hashSync(password, salt);
    }

    const updatedUser = updateUser(userId, {
      name: name ? name.trim() : undefined,
      email: email ? email.trim() : undefined,
      passwordHash,
    });

    if (!updatedUser) {
      return res.status(404).json({ error: 'User record not found' });
    }

    // Issue updated JWT token reflecting updated user data
    const newToken = jwt.sign({ userId: updatedUser.id, role: updatedUser.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
      token: newToken,
    });
  } catch (err: any) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Location Reverse Geocoding and Autocomplete Search Endpoints
app.get('/api/location/reverse', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'Valid latitude and longitude are required' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`;
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'WomenSafe-AI-Risk-Predictor/2.4 (contact@womensafe.ai)',
        'Accept-Language': 'en',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(502).json({
        error: 'Geocoding service unavailable. You can enter or select your location manually.',
      });
    }

    const data: any = await response.json();
    const address = data.address || {};

    const country = address.country || '';
    const countryCode = (address.country_code || '').toLowerCase();
    const state = address.state || address.province || address.region || '';
    const city = address.city || address.town || address.village || address.municipality || address.county || '';
    const area = address.suburb || address.neighbourhood || address.residential || address.road || address.quarter || address.city_district || '';
    
    // Construct readable location label
    const parts = [area, city, state, country].filter(Boolean);
    const formattedAddress = parts.length > 0 ? parts.join(', ') : (data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);

    return res.json({
      success: true,
      location: {
        country,
        countryCode,
        state,
        city,
        area,
        displayName: data.display_name || formattedAddress,
        formattedAddress,
        latitude: lat,
        longitude: lng,
      },
    });
  } catch (err: any) {
    console.error('Reverse geocoding error:', err);
    return res.status(502).json({
      error: 'Unable to reverse geocode coordinates at this time. Please enter location manually.',
    });
  }
});

app.get('/api/location/search', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string || '').trim();
    if (!query || query.length < 2) {
      return res.json({ success: true, results: [] });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(query)}`;
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'WomenSafe-AI-Risk-Predictor/2.4 (contact@womensafe.ai)',
        'Accept-Language': 'en',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(502).json({ error: 'Search service unavailable' });
    }

    const list: any[] = await response.json();
    const results = list.map((item) => {
      const address = item.address || {};
      const country = address.country || '';
      const countryCode = (address.country_code || '').toLowerCase();
      const state = address.state || address.province || address.region || '';
      const city = address.city || address.town || address.village || address.municipality || address.county || '';
      const area = address.suburb || address.neighbourhood || address.road || '';
      const parts = [area, city, state, country].filter(Boolean);
      const formattedAddress = parts.length > 0 ? parts.join(', ') : item.display_name;

      return {
        displayName: item.display_name,
        formattedAddress,
        country,
        countryCode,
        state,
        city,
        area,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
      };
    });

    return res.json({ success: true, results });
  } catch (err: any) {
    console.error('Location search error:', err);
    return res.status(502).json({ error: 'Failed to search locations' });
  }
});

// 2. Risk Prediction & Assessment Endpoints
app.post('/api/risk/predict', optionalAuth, (req: AuthenticatedRequest, res) => {
  try {
    const input: AssessmentInput = req.body;

    if (!input.location || !input.areaType || !input.lightingCondition || !input.crowdLevel) {
      return res.status(400).json({ error: 'Incomplete environmental parameters provided' });
    }

    // Execute explainable Machine Learning Risk Model
    const result = evaluateRisk(input);

    // Persist assessment record in database
    const userId = req.user ? req.user.id : 'usr_guest_session';
    const savedRecord = saveAssessment({
      user_id: userId,
      location: input.location,
      latitude: input.latitude || null,
      longitude: input.longitude || null,
      date: input.date || new Date().toISOString().split('T')[0],
      time: input.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      day: input.day || new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      area_type: input.areaType,
      lighting_condition: input.lightingCondition,
      crowd_level: input.crowdLevel,
      emergency_distance: input.emergencyDistance,
      historical_risk: input.historicalRisk,
      travel_mode: input.travelMode,
      companion_status: input.companionStatus,
      nearby_amenities: input.nearbyAmenities || [],
      risk_score: result.riskScore,
      risk_level: result.riskLevel,
      contributing_factors: result.contributingFactors,
      recommendations: result.recommendations,
    });

    res.json({
      success: true,
      assessmentId: savedRecord.id,
      result,
      record: savedRecord,
    });
  } catch (err: any) {
    console.error('Risk prediction error:', err);
    res.status(500).json({ error: 'Failed to compute risk assessment' });
  }
});

app.get('/api/risk/history', authenticateToken, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const records = getAssessmentsForUser(userId);
    res.json({ records });
  } catch (err: any) {
    console.error('History fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve assessment history' });
  }
});

app.get('/api/risk/:id', optionalAuth, (req: AuthenticatedRequest, res) => {
  try {
    const record = getAssessmentById(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Assessment record not found' });
    }
    res.json({ record });
  } catch (err: any) {
    console.error('Record detail error:', err);
    res.status(500).json({ error: 'Failed to retrieve assessment record' });
  }
});

app.delete('/api/risk/:id', authenticateToken, (req: AuthenticatedRequest, res) => {
  try {
    const recordId = req.params.id;
    const userId = req.user!.id;
    const isAdmin = req.user!.role === 'admin';

    const deleted = deleteAssessment(recordId, userId, isAdmin);
    if (!deleted) {
      return res.status(404).json({ error: 'Record not found or unauthorized to delete' });
    }

    res.json({ success: true, message: 'Assessment record deleted successfully' });
  } catch (err: any) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

// 3. Admin Endpoints
app.get('/api/admin/stats', authenticateToken, requireAdmin, (req, res) => {
  try {
    const stats = getSystemStats();
    res.json(stats);
  } catch (err: any) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to generate analytics stats' });
  }
});

app.get('/api/admin/assessments', authenticateToken, requireAdmin, (req, res) => {
  try {
    const assessments = getAllAssessments();
    res.json({ assessments });
  } catch (err: any) {
    console.error('Admin assessments error:', err);
    res.status(500).json({ error: 'Failed to load system assessments' });
  }
});

app.post('/api/admin/retrain', authenticateToken, requireAdmin, (req, res) => {
  try {
    const updatedMetrics = retrainModelSimulated();
    res.json({
      message: 'Machine learning model pipeline re-trained and re-calibrated successfully',
      metrics: updatedMetrics,
    });
  } catch (err: any) {
    console.error('Retrain error:', err);
    res.status(500).json({ error: 'Failed to execute retraining pipeline' });
  }
});

// Admin User Management Endpoints
app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
  try {
    const users = getAllUsers();
    res.json({ users });
  } catch (err: any) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Failed to retrieve registered users' });
  }
});

app.put('/api/admin/users/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const targetId = req.params.id;
    const { name, email, role, password } = req.body;

    if (email) {
      const existing = findUserByEmail(email.trim());
      if (existing && existing.id !== targetId) {
        return res.status(409).json({ error: 'This email is already associated with another account' });
      }
    }

    let passwordHash: string | undefined;
    if (password && password.trim().length > 0) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }
      const salt = bcrypt.genSaltSync(10);
      passwordHash = bcrypt.hashSync(password, salt);
    }

    const updatedUser = updateUser(targetId, {
      name: name ? name.trim() : undefined,
      email: email ? email.trim() : undefined,
      role: role || undefined,
      passwordHash,
    });

    if (!updatedUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    res.json({
      message: 'User account updated successfully',
      user: updatedUser,
    });
  } catch (err: any) {
    console.error('Admin update user error:', err);
    res.status(500).json({ error: 'Failed to update user account' });
  }
});

app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const targetId = req.params.id;
    if (req.user?.id === targetId) {
      return res.status(400).json({ error: 'Cannot delete the currently logged in administrator account' });
    }
    const success = deleteUser(targetId);
    if (!success) {
      return res.status(404).json({ error: 'User account not found' });
    }
    res.json({ message: 'User account and associated records deleted successfully' });
  } catch (err: any) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user account' });
  }
});

// Public Stats endpoint (for landing page trust metrics)
app.get('/api/public/stats', (req, res) => {
  const stats = getSystemStats();
  res.json({
    totalAssessments: stats.totalAssessments,
    averageRiskScore: stats.averageRiskScore,
    modelAccuracy: (stats.modelMetrics.accuracy * 100).toFixed(1) + '%',
    trainingSamples: stats.modelMetrics.trainingSamples,
  });
});

/* =========================================================================
   VITE MIDDLEWARE & SERVER STARTUP
   ========================================================================= */

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        if (req.path.startsWith('/api')) {
          return res.status(404).json({ error: 'Endpoint not found' });
        }
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send('Application build not found.');
        }
      });
    } else {
      console.warn('Warning: dist/ directory not found in production mode.');
    }
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`WomenSafe AI Server running on port ${PORT} [env: ${isProduction ? 'production' : 'development'}]`);
    });
  }
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
export { app };
