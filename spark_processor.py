import os
import glob
import sys

# 1. Force PySpark to use Java 17
java_paths = glob.glob("C:\\Program Files\\Java\\jdk-17*") + glob.glob("C:\\Program Files\\Eclipse Adoptium\\jdk-17*")
if java_paths:
    os.environ["JAVA_HOME"] = java_paths[0]
    os.environ["PATH"] = os.path.join(java_paths[0], "bin") + ";" + os.environ.get("PATH", "")
    print(f"[*] Forced JAVA_HOME to: {os.environ['JAVA_HOME']}")
else:
    print("[!] WARNING: Java 17 not found in standard directories.")

# 2. Force Hadoop Winutils
os.environ['HADOOP_HOME'] = "C:\\hadoop"
sys.path.append("C:\\hadoop\\bin")
if "C:\\hadoop\\bin" not in os.environ.get("PATH", ""):
    os.environ["PATH"] = "C:\\hadoop\\bin;" + os.environ.get("PATH", "")

from pyspark.sql import SparkSession
from pyspark.sql.functions import from_json, col, window
from pyspark.sql.types import StructType, StructField, StringType, TimestampType

# Initialize PySpark SparkSession with Kafka integration and PostgreSQL JDBC packages
spark = (
    SparkSession.builder
    .appName("FraudDetectionPipeline")
    .config(
        "spark.jars.packages",
        "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.0,org.postgresql:postgresql:42.6.0"
    )
    .config("spark.sql.shuffle.partitions", "4")
    .getOrCreate()
)

# Set logging level to WARN to keep console output readable
spark.sparkContext.setLogLevel("WARN")

# Define strict schema matching the Python producer
clickstream_schema = StructType([
    StructField("user_id", StringType(), True),
    StructField("ip_address", StringType(), True),
    StructField("action", StringType(), True),
    StructField("timestamp", StringType(), True)
])

# Read streaming data from Kafka topic 'raw_clickstream'
kafka_df = (
    spark.readStream
    .format("kafka")
    .option("kafka.bootstrap.servers", "localhost:9092")
    .option("subscribe", "raw_clickstream")
    .option("startingOffsets", "latest")
    .load()
)

# Parse JSON payload, flatten columns, and cast timestamp to TimestampType
parsed_df = (
    kafka_df
    .selectExpr("CAST(value AS STRING)")
    .select(from_json(col("value"), clickstream_schema).alias("data"))
    .select("data.*")
    .withColumn("timestamp", col("timestamp").cast(TimestampType()))
)

# Apply BDA streaming logic: Watermark -> 1-minute tumbling window -> Count -> Filter anomalies (> 50)
anomalies_df = (
    parsed_df
    .withWatermark("timestamp", "1 minute")
    .groupBy(
        window(col("timestamp"), "1 minute"),
        col("user_id")
    )
    .count()
    .filter(col("count") >= 5)
)

def save_to_postgres(df, epoch_id):
    # Bypassing Py4J isEmpty() bug; Spark handles empty batch writes safely.
    print(f"[*] Micro-batch {epoch_id} -> persisting updates to PostgreSQL...")
    df.select(
        col("window.start").alias("window_start"),
        col("window.end").alias("window_end"),
        col("user_id"),
        col("count").alias("click_count")
    ).write \
     .format("jdbc") \
     .option("url", "jdbc:postgresql://localhost:5432/fraud_db") \
     .option("driver", "org.postgresql.Driver") \
     .option("dbtable", "anomalies") \
     .option("user", "admin") \
     .option("password", "password") \
     .mode("append") \
     .save()
    print(f"[✓] Micro-batch {epoch_id} committed to 'anomalies' table.")

# Write streaming anomalies to PostgreSQL using foreachBatch
query = (
    anomalies_df.writeStream
    .foreachBatch(save_to_postgres)
    .outputMode("update")
    .start()
)

# Keep the streaming query alive and handle Ctrl+C cleanly
try:
    spark.streams.awaitAnyTermination()
except KeyboardInterrupt:
    print("\n[*] Gracefully stopping streaming query...")
    query.stop()
    print("[*] Stream stopped cleanly.")
