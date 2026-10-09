# Handoff & Context

**Project:** Real-Time E-commerce Fraud & Anomaly Detection Pipeline
**Timeframe:** 2 Days
**Architecture Flow:** Python Generator -> Kafka -> PySpark -> PostgreSQL -> FastAPI -> React

## Core Logic
- **Anomaly condition:** > 50 clicks from a single `user_id` within a 1-minute tumbling/sliding window.

## Current State
- [x] Project planning complete.
- [x] Infrastructure (Docker) completed.
- [x] Python Data Generator completed.
- [x] Spark Connection completed.
- [x] BDA Logic (Windowing & Filtering) completed.
- [x] Database Sink (PostgreSQL) completed (Phase 2 Complete).
- [x] Backend API (FastAPI) completed.
- [x] Frontend Dashboard (React) completed (Phase 3 Complete).

## Project Completion Status
- 🚀 **Full End-to-End Pipeline Operational:**
  - Ingestion: `producer.py` streaming raw clickstream to Kafka topic `raw_clickstream`.
  - Processing: `spark_processor.py` Structured Streaming with 1-min watermark & tumbling window.
  - Persistence: Micro-batches committed to PostgreSQL `fraud_db.anomalies`.
  - Serving: FastAPI REST API (`main.py`) exposing `/api/anomalies` with CORS enabled.
  - Visualization: React + Tailwind CSS dashboard with live polling, KPI stats, and anomaly inspection.