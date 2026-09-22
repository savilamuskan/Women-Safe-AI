/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { RiskAssessmentRecord, SystemStats, User } from '../types.ts';

interface StoredUser extends User {
  password_hash: string;
}

interface DatabaseSchema {
  users: StoredUser[];
  risk_assessments: RiskAssessmentRecord[];
  model_metadata: {
    name: string;
    version: string;
    accuracy: number;
    f1Score: number;
    rocAuc: number;
    trainingSamples: number;
    lastTrained: string;
  };
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getInitialDatabase(): DatabaseSchema {
  const salt = bcrypt.genSaltSync(10);
  const userHash = bcrypt.hashSync('password123', salt);
  const adminHash = bcrypt.hashSync('admin123', salt);

  const now = new Date();

  return {
    users: [
      {
        id: 'usr_user1',
        name: 'Ayesha Khan',
        email: 'user@womensafe.ai',
        role: 'user',
        password_hash: userHash,
        created_at: new Date(now.getTime() - 86400000 * 14).toISOString(),
      },
      {
        id: 'usr_admin1',
        name: 'Zainab Malik (Admin)',
        email: 'admin@womensafe.ai',
        role: 'admin',
        password_hash: adminHash,
        created_at: new Date(now.getTime() - 86400000 * 30).toISOString(),
      },
    ],
    risk_assessments: [
      {
        id: 'rec_sample_01',
        user_id: 'usr_user1',
        location: 'Lahore Metro Station & Kalma Chowk Corridor, Gulberg',
        latitude: 31.5034,
        longitude: 74.3318,
        date: new Date(now.getTime() - 86400000 * 1).toISOString().split('T')[0],
        time: '22:45',
        day: 'Friday',
        area_type: 'transit_hub',
        lighting_condition: 'moderate',
        crowd_level: 'low',
        emergency_distance: '500m_1km',
        historical_risk: 'moderate',
        travel_mode: 'public_transit',
        companion_status: 'alone',
        nearby_amenities: ['open_cafe', 'transit_booth'],
        risk_score: 54,
        risk_level: 'Medium',
        contributing_factors: [
          {
            factor: 'Late Evening Hours (20:00 - 23:00)',
            category: 'time',
            impact: 'amplifier',
            scoreImpact: 8,
            description: 'Reduced bystander density and fewer retail stores open.',
          },
          {
            factor: 'Sparse Pedestrian Traffic',
            category: 'crowd',
            impact: 'amplifier',
            scoreImpact: 13,
            description: 'Occasional foot traffic with prolonged gaps.',
          },
          {
            factor: 'Proximity to Transit Attendants',
            category: 'buffer',
            impact: 'buffer',
            scoreImpact: -7,
            description: 'Transit ticketing and security booth active nearby.',
          },
        ],
        recommendations: [
          'Remain within direct line-of-sight of the station conductor or ticket window while waiting for train.',
          'Share live trip journey status with a designated contact via WhatsApp or SMS.',
          'Keep emergency hotlines (15 & 1043) on quick-dial.',
        ],
        created_at: new Date(now.getTime() - 86400000 * 1).toISOString(),
      },
      {
        id: 'rec_sample_02',
        user_id: 'usr_user1',
        location: 'Bund Road Industrial Corridor & Badami Bagh Bypass, Lahore',
        latitude: 31.6015,
        longitude: 74.3187,
        date: new Date(now.getTime() - 86400000 * 3).toISOString().split('T')[0],
        time: '01:15',
        day: 'Wednesday',
        area_type: 'industrial',
        lighting_condition: 'pitch_dark',
        crowd_level: 'deserted',
        emergency_distance: 'over_3km',
        historical_risk: 'high',
        travel_mode: 'walking',
        companion_status: 'alone',
        nearby_amenities: [],
        risk_score: 84,
        risk_level: 'High',
        contributing_factors: [
          {
            factor: 'Pitch Dark / Broken Streetlamps',
            category: 'lighting',
            impact: 'amplifier',
            scoreImpact: 25,
            description: 'Minimal artificial illumination severely limits visibility.',
          },
          {
            factor: 'Deserted Industrial Corridor',
            category: 'area',
            impact: 'amplifier',
            scoreImpact: 18,
            description: 'Heavy warehousing with blind corners and no open businesses.',
          },
          {
            factor: 'Far Distance to Emergency Services',
            category: 'emergency',
            impact: 'amplifier',
            scoreImpact: 15,
            description: 'Substantial delay for emergency vehicle response.',
          },
        ],
        recommendations: [
          'Immediate route deflection: Re-route towards main lighted boulevard with active vehicular traffic.',
          'Do not linger on foot; request a rideshare (Careem / Indrive / Uber) directly to a verified pickup point.',
          'Pre-arm phone SOS shortcut and dial 15 / 1043 if suspicious individuals approach.',
        ],
        created_at: new Date(now.getTime() - 86400000 * 3).toISOString(),
      },
      {
        id: 'rec_sample_03',
        user_id: 'usr_user1',
        location: 'Jinnah Super Market & Kohsar Promenade, F-7 Islamabad',
        latitude: 33.7208,
        longitude: 73.0560,
        date: new Date(now.getTime() - 86400000 * 5).toISOString().split('T')[0],
        time: '15:30',
        day: 'Monday',
        area_type: 'commercial',
        lighting_condition: 'well_lit',
        crowd_level: 'high',
        emergency_distance: 'under_500m',
        historical_risk: 'low',
        travel_mode: 'walking',
        companion_status: 'with_group',
        nearby_amenities: ['pharmacy', 'metro_station', 'security_kiosk'],
        risk_score: 18,
        risk_level: 'Low',
        contributing_factors: [
          {
            factor: 'Daylight High Ambient Visibility',
            category: 'time',
            impact: 'buffer',
            scoreImpact: -12,
            description: 'Natural daylight provides comprehensive sightlines.',
          },
          {
            factor: 'Dense Pedestrian Presence',
            category: 'crowd',
            impact: 'buffer',
            scoreImpact: -15,
            description: 'High volume of shoppers and commuters provides collective safety.',
          },
          {
            factor: 'Police Sub-station Vicinity',
            category: 'emergency',
            impact: 'buffer',
            scoreImpact: -12,
            description: 'Civic emergency dispatch within 300 meters.',
          },
        ],
        recommendations: [
          'Maintain standard situational mindfulness in crowded public squares.',
          'Keep personal belongings zipped and secured in pockets or cross-body bags.',
        ],
        created_at: new Date(now.getTime() - 86400000 * 5).toISOString(),
      },
    ],
    model_metadata: {
      name: 'WomenSafe-Ensemble-RF-v2.4',
      version: '2.4.0',
      accuracy: 0.924,
      f1Score: 0.918,
      rocAuc: 0.947,
      trainingSamples: 14200,
      lastTrained: new Date(now.getTime() - 86400000 * 2).toISOString(),
    },
  };
}

export function readDb(): DatabaseSchema {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const initial = getInitialDatabase();
    writeDb(initial);
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read db.json, returning initial seed:', err);
    return getInitialDatabase();
  }
}

export function writeDb(data: DatabaseSchema): void {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// User Operations
export function findUserByEmail(email: string): StoredUser | undefined {
  const db = readDb();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: string): StoredUser | undefined {
  const db = readDb();
  return db.users.find((u) => u.id === id);
}

export function createUser(name: string, email: string, passwordHash: string, role: 'user' | 'admin' = 'user'): User {
  const db = readDb();
  const newUser: StoredUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name,
    email: email.toLowerCase(),
    role,
    password_hash: passwordHash,
    created_at: new Date().toISOString(),
  };
  db.users.push(newUser);
  writeDb(db);

  const { password_hash, ...publicUser } = newUser;
  return publicUser;
}

// Assessment Operations
export function saveAssessment(assessment: Omit<RiskAssessmentRecord, 'id' | 'created_at'>): RiskAssessmentRecord {
  const db = readDb();
  const record: RiskAssessmentRecord = {
    ...assessment,
    id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    created_at: new Date().toISOString(),
  };

  db.risk_assessments.unshift(record);
  writeDb(db);
  return record;
}

export function getAssessmentsForUser(userId: string): RiskAssessmentRecord[] {
  const db = readDb();
  return db.risk_assessments.filter((a) => a.user_id === userId);
}

export function getAllAssessments(): RiskAssessmentRecord[] {
  const db = readDb();
  return db.risk_assessments;
}

export function getAssessmentById(id: string): RiskAssessmentRecord | undefined {
  const db = readDb();
  return db.risk_assessments.find((a) => a.id === id);
}

export function deleteAssessment(id: string, userId?: string, isAdmin: boolean = false): boolean {
  const db = readDb();
  const initialLength = db.risk_assessments.length;

  db.risk_assessments = db.risk_assessments.filter((a) => {
    if (a.id !== id) return true;
    // Only allow deletion if admin or matching userId
    if (isAdmin) return false;
    if (userId && a.user_id === userId) return false;
    return true;
  });

  const changed = db.risk_assessments.length !== initialLength;
  if (changed) {
    writeDb(db);
  }
  return changed;
}

export function getSystemStats(): SystemStats {
  const db = readDb();
  const total = db.risk_assessments.length;

  let low = 0;
  let medium = 0;
  let high = 0;
  let totalScore = 0;

  const todayStr = new Date().toISOString().split('T')[0];
  let assessmentsToday = 0;

  const areaMap: Record<string, { totalScore: number; count: number }> = {};
  const hourMap: Record<number, { totalScore: number; count: number }> = {};

  for (let h = 0; h < 24; h++) {
    hourMap[h] = { totalScore: 0, count: 0 };
  }

  for (const item of db.risk_assessments) {
    totalScore += item.risk_score;
    if (item.risk_level === 'High') high++;
    else if (item.risk_level === 'Medium') medium++;
    else low++;

    if (item.created_at && item.created_at.startsWith(todayStr)) {
      assessmentsToday++;
    }

    const area = item.area_type || 'other';
    if (!areaMap[area]) {
      areaMap[area] = { totalScore: 0, count: 0 };
    }
    areaMap[area].totalScore += item.risk_score;
    areaMap[area].count += 1;

    let hour = 12;
    if (item.time) {
      const parts = item.time.split(':');
      hour = parseInt(parts[0], 10) || 12;
    }
    if (hourMap[hour]) {
      hourMap[hour].totalScore += item.risk_score;
      hourMap[hour].count += 1;
    }
  }

  const areaRiskBreakdown = Object.entries(areaMap).map(([area, data]) => ({
    area,
    count: data.count,
    averageScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
  }));

  const hourlyRiskTrend = Object.entries(hourMap).map(([hour, data]) => ({
    hour: parseInt(hour, 10),
    count: data.count,
    averageScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
  }));

  return {
    totalAssessments: total,
    riskDistribution: { low, medium, high },
    averageRiskScore: total > 0 ? Math.round(totalScore / total) : 0,
    assessmentsToday,
    modelMetrics: db.model_metadata,
    areaRiskBreakdown,
    hourlyRiskTrend,
  };
}

export function retrainModelSimulated(): SystemStats['modelMetrics'] {
  const db = readDb();
  const count = db.risk_assessments.length;
  const newSamples = 14200 + count;
  const accuracy = +(0.924 + (Math.random() * 0.015 - 0.005)).toFixed(3);
  const f1Score = +(0.918 + (Math.random() * 0.012 - 0.004)).toFixed(3);
  const rocAuc = +(0.947 + (Math.random() * 0.010 - 0.003)).toFixed(3);

  db.model_metadata = {
    name: 'WomenSafe-Ensemble-RF-v2.4',
    version: '2.4.' + (parseInt(db.model_metadata.version.split('.')[2] || '0', 10) + 1),
    accuracy,
    f1Score,
    rocAuc,
    trainingSamples: newSamples,
    lastTrained: new Date().toISOString(),
  };
  writeDb(db);
  return db.model_metadata;
}
