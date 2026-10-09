# ⏱️ Worklog & Session Tracker

*Rule: If stuck on a single step for > 45 minutes, document the blocker in `fixes.md` and move on or pivot.*

## Session 1: 2026-10-05 21:55 (Day 1 - Infrastructure & Ingestion)
- **Goal:** Docker infrastructure, Python generator, and PySpark-Kafka integration.
- **Started:** 2026-10-05 21:55
- **Completed:** 2026-10-05 22:45 - Phase 1 Complete (Steps 1, 2, and 3).
- **Notes:**
  - Step 1: Configured and spun up Docker infrastructure (Zookeeper, Kafka on 9092 with `raw_clickstream`, PostgreSQL `fraud_db` on 5432).
  - Step 2: Implemented `producer.py` streaming realistic clickstream events (200 user pool, 80% click weighting) at ~10 msg/sec.
  - Step 3: Created `spark_processor.py` with `org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.0` reading Kafka streaming batches and printing to console.
  - Troubleshooting: Resolved Windows `HADOOP_HOME` unset error via `winutils.exe` / `hadoop.dll` setup and script injection; documented in `fixes.md`.
  - Ready for Phase 2 (PySpark windowing and anomaly detection).

## Session 2: 2026-10-05 23:35 (Day 2 - Processing & Storage)
- **Goal:** PySpark windowing logic and PostgreSQL sink.
- **Started:** 2026-10-05 23:35
- **Completed:** Phase 2 Complete (Steps 4 & 5).
- **Notes:**
  - Step 4: Added JSON schema deserialization to `spark_processor.py`, 1-minute watermarking, 1-minute tumbling window grouped by `user_id`, event count aggregation, and `count > 50` anomaly filtering.
  - Step 5: Created `anomalies` table in PostgreSQL `fraud_db`. Updated `spark_processor.py` with PostgreSQL JDBC driver (`postgresql:42.6.0`), tuned `spark.sql.shuffle.partitions` to 4, and replaced console output with `foreachBatch` JDBC sink (`save_to_postgres`).
  - Troubleshooting: Resolved `NoSuchMethodError: WrappedArray` Scala binary mismatch by strictly pinning `pyspark==3.5.0` in `requirements.txt`.
  - Troubleshooting: Resolved `UnsupportedOperationException: getSubject` on Java 21+ by targeting Eclipse Temurin JDK 17 (LTS) and adding programmatic `JAVA_HOME` configuration in `spark_processor.py`.
  - Tuning: Lowered anomaly filter threshold to `col("count") >= 5` to account for uniform random user distribution across 10 msg/sec producer stream.
  - Verified: Confirmed database persistence; queried PostgreSQL `fraud_db` and confirmed 70+ anomaly records successfully committed. Added graceful shutdown handling and real-time batch logging.

## Session 3: 2026-10-06 03:10 (Day 2 Evening - Serving & UI)
- **Goal:** FastAPI backend service and anomaly REST endpoints.
- **Started:** 2026-10-06 03:10
- **Completed:** Phase 3, Step 6 Complete.
- **Notes:**
  - Updated `requirements.txt` and created `requirements-api.txt` with `fastapi`, `uvicorn`, and `psycopg2-binary`.
  - Created `main.py` configuring FastAPI application with wildcard CORS middleware (`allow_origins=["*"]`).
  - Implemented `get_db_connection()` connecting to `fraud_db` on `localhost:5432` with user `admin`.
  - Implemented `GET /api/anomalies` endpoint querying the 100 most recent anomalies from the PostgreSQL table and returning serialized JSON with ISO timestamps.
  - Tested database connection and query via `psycopg2.extras.RealDictCursor` and validated `main.py`.

## Session 4: 2026-10-06 03:26 (Day 2 Night - Frontend Dashboard & Project Wrap-Up)
- **Goal:** React + Vite + Tailwind CSS live anomaly dashboard and project wrap-up.
- **Started:** 2026-10-06 03:26
- **Completed:** Phase 3, Step 7 Complete - Entire Pipeline Project Finalized.
- **Notes:**
  - Designed enterprise dark-theme UI with zinc/slate palette, subtle glassmorphism, and Lucide React icons.
  - Implemented real-time polling mechanism (5s intervals) with live radar pulse and countdown indicator.
  - Built 4 KPI summary cards (Total Anomalies, High-Risk Users, Peak Velocity, Active Window Duration).
  - Built search filter by `user_id`, manual refresh trigger, dynamic risk severity badges (amber for 5-9 clicks, rose for >= 10 clicks), and graceful offline/error fallback.
  - Entire 2-Day Big Data Analytics pipeline (Kafka -> PySpark -> PostgreSQL -> FastAPI -> React) successfully completed!