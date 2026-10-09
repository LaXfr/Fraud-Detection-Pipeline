from datetime import datetime
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor

# Initialize FastAPI app
app = FastAPI(
    title="Real-Time Fraud & Anomaly Detection API",
    description="Backend API serving real-time clickstream anomaly metrics",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection settings
DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "fraud_db",
    "user": "admin",
    "password": "password"
}

def get_db_connection():
    """Establish and return a connection to PostgreSQL."""
    return psycopg2.connect(**DB_CONFIG)

@app.get("/")
def root():
    return {
        "service": "Fraud Detection API",
        "status": "online",
        "endpoints": {
            "anomalies": "/api/anomalies"
        }
    }

@app.get("/api/anomalies")
def get_anomalies():
    """
    Query the database for the latest 100 anomalies and return as JSON.
    """
    query = """
        SELECT window_start, window_end, user_id, click_count
        FROM anomalies
        ORDER BY window_start DESC
        LIMIT 100;
    """
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query)
            rows = cursor.fetchall()
            
            anomalies = []
            for row in rows:
                anomalies.append({
                    "window_start": row["window_start"].isoformat() if isinstance(row["window_start"], datetime) else str(row["window_start"]),
                    "window_end": row["window_end"].isoformat() if isinstance(row["window_end"], datetime) else str(row["window_end"]),
                    "user_id": row["user_id"],
                    "click_count": row["click_count"]
                })
            return anomalies
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
