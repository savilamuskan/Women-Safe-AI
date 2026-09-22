"""
WomenSafe AI - SQLAlchemy ORM Models
PostgreSQL model mappings for Users and RiskAssessments
"""

from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Date, Time, Numeric, ForeignKey, JSON
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(32), default="user", nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    assessments = relationship("RiskAssessment", back_populates="user", cascade="all, delete-orphan")


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    location = Column(String(255), nullable=False)
    latitude = Column(Numeric(10, 7), nullable=True)
    longitude = Column(Numeric(10, 7), nullable=True)
    date = Column(Date, nullable=False)
    time = Column(Time, nullable=False)
    day = Column(String(20), nullable=False)
    area_type = Column(String(50), nullable=False)
    lighting_condition = Column(String(50), nullable=False)
    crowd_level = Column(String(50), nullable=False)
    emergency_distance = Column(String(50), nullable=False)
    historical_risk = Column(String(50), nullable=False)
    travel_mode = Column(String(50), default="walking")
    companion_status = Column(String(50), default="alone")
    nearby_amenities = Column(JSON, default=list)
    risk_score = Column(Integer, nullable=False)
    risk_level = Column(String(20), nullable=False, index=True)
    contributing_factors = Column(JSON, nullable=False, default=list)
    recommendations = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="assessments")
