-- WomenSafe AI - PostgreSQL Database Schema
-- Production DDL for Users and RiskAssessments

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS risk_assessments (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    date DATE NOT NULL,
    time TIME NOT NULL,
    day VARCHAR(20) NOT NULL,
    area_type VARCHAR(50) NOT NULL,
    lighting_condition VARCHAR(50) NOT NULL,
    crowd_level VARCHAR(50) NOT NULL,
    emergency_distance VARCHAR(50) NOT NULL,
    historical_risk VARCHAR(50) NOT NULL,
    travel_mode VARCHAR(50) DEFAULT 'walking',
    companion_status VARCHAR(50) DEFAULT 'alone',
    nearby_amenities JSONB DEFAULT '[]'::jsonb,
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('Low', 'Medium', 'High')),
    contributing_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON risk_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_risk_level ON risk_assessments(risk_level);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON risk_assessments(created_at DESC);
