# Project Roadmap

### Phase 1: Infrastructure & Ingestion (Day 1)
- [x] **1. Docker Setup:** Kafka, Zookeeper, PostgreSQL.
- [x] **2. Data Generator:** Python `Faker` script pushing JSON to `raw_clickstream` Kafka topic.
- [x] **3. Spark Connection:** PySpark script reading from Kafka to console.

### Phase 2: Processing & Storage (Day 2 Morning/Afternoon)
- [x] **4. BDA Logic:** PySpark structured streaming with 1-minute windowing & anomaly filtering.
- [x] **5. Database Sink:** PySpark writing flagged anomalies to PostgreSQL via JDBC.

### Phase 3: Serving & UI (Day 2 Evening)
- [x] **6. Backend API:** FastAPI server querying PostgreSQL and serving JSON on `/api/anomalies`.
- [x] **7. Frontend Dashboard:** React app fetching from FastAPI and rendering real-time metrics.