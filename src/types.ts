/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ContributingFactor {
  factor: string;
  category: 'lighting' | 'crowd' | 'emergency' | 'area' | 'time' | 'isolation' | 'buffer';
  impact: 'amplifier' | 'buffer' | 'neutral';
  scoreImpact: number; // e.g. +18 or -12
  description: string;
}

export interface AssessmentInput {
  location: string;
  latitude?: number;
  longitude?: number;
  date: string;
  time: string;
  day: string;
  areaType: 'commercial' | 'transit_hub' | 'residential' | 'industrial' | 'park' | 'deserted_alley' | 'campus' | 'suburban';
  lightingCondition: 'well_lit' | 'moderate' | 'dim' | 'pitch_dark';
  crowdLevel: 'high' | 'moderate' | 'low' | 'deserted';
  emergencyDistance: 'under_500m' | '500m_1km' | '1km_3km' | 'over_3km';
  historicalRisk: 'low' | 'moderate' | 'elevated' | 'high';
  nearbyAmenities: string[]; // e.g. ['24_7_store', 'police_booth', 'metro_station', 'open_cafe']
  travelMode: 'walking' | 'public_transit' | 'rideshare' | 'personal_vehicle' | 'waiting';
  companionStatus: 'alone' | 'with_companion' | 'with_group';
}

export interface RiskResult {
  riskScore: number; // 0 - 100
  riskLevel: 'Low' | 'Medium' | 'High';
  confidenceScore: number; // 0.85 - 0.98
  summary: string;
  explanation: string;
  contributingFactors: ContributingFactor[];
  recommendations: string[];
  immediateDangerNotice: string;
  evaluatedAt: string;
}

export interface RiskAssessmentRecord {
  id: string;
  user_id: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  date: string;
  time: string;
  day: string;
  area_type: string;
  lighting_condition: string;
  crowd_level: string;
  emergency_distance: string;
  historical_risk: string;
  travel_mode?: string;
  companion_status?: string;
  nearby_amenities?: string[];
  risk_score: number;
  risk_level: 'Low' | 'Medium' | 'High';
  contributing_factors: ContributingFactor[];
  recommendations: string[];
  created_at: string;
}

export type AssessmentRecord = RiskAssessmentRecord;

export interface SystemStats {
  totalAssessments: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  riskLevelBreakdown?: {
    low: number;
    medium: number;
    high: number;
  };
  averageRiskScore: number;
  assessmentsToday: number;
  modelMetrics: {
    name: string;
    version: string;
    accuracy: number;
    f1Score: number;
    rocAuc: number;
    trainingSamples: number;
    lastTrained: string;
  };
  areaRiskBreakdown: { area: string; averageScore: number; count: number }[];
  areaBreakdown?: Record<string, number>;
  hourlyRiskTrend: { hour: number; averageScore: number; count: number }[];
}
