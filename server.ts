/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { evaluateRisk } from './src/server/ml-engine.ts';
import {
  createUser,
  deleteAssessment,
  findUserByEmail,
  findUserById,
  getAllAssessments,
  getAssessmentById,
  getAssessmentsForUser,
  getSystemStats,
  retrainModelSimulated,
  saveAssessment,
} from './src/server/db.ts';
import { AssessmentInput, User } from './src/types.ts';

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'womensafe-ai-production-secret-2026-key';

// Standard middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom request interface with authenticated user
interface AuthenticatedRequest extends Request {
  user?: User;
}

// Auth Middleware
function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: 'user' | 'admin' };
    const user = findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User session invalid or expired' });
    }
    const { password_hash, ...publicUser } = user;
    req.user = publicUser;
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
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: 'user' | 'admin' };
      const user = findUserById(decoded.userId);
      if (user) {
        const { password_hash, ...publicUser } = user;
        req.user = publicUser;
      }
    } catch {
      // Ignore token error for optional auth
    }
  }
  next();
}

// Admin Gate Middleware
function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin authorization required' });
  }
  next();
}

/* =========================================================================
   REST API ENDPOINTS
   ========================================================================= */

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'WomenSafe AI API', timestamp: new Date().toISOString() });
});

// 1. Authentication Endpoints
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const existing = findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const user = createUser(name.trim(), email.trim(), passwordHash, 'user');

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Registration successful',
      user,
      token,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to complete registration' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

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

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password_hash, ...publicUser } = user;

    res.json({
      message: 'Login successful',
      user: publicUser,
      token,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to authenticate user' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/me', authenticateToken, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
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
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WomenSafe AI Server running on port ${PORT}`);
  });
}

startServer();
