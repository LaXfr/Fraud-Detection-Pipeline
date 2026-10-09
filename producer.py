import json
import random
import time
from datetime import datetime
from faker import Faker
from kafka import KafkaProducer

# Initialize Faker
fake = Faker()

# Configuration
BOOTSTRAP_SERVERS = ['localhost:9092']
TOPIC_NAME = 'raw_clickstream'

# Fixed pool of ~200 users to enable frequency-based anomaly detection (>50 clicks/min)
USER_POOL = [f"U{i}" for i in range(1, 201)]

# Actions with 80% click weighting
ACTIONS = ['click', 'add_to_cart', 'purchase']
ACTION_WEIGHTS = [0.80, 0.10, 0.10]

# Kafka Producer with JSON value serializer
producer = KafkaProducer(
    bootstrap_servers=BOOTSTRAP_SERVERS,
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

def generate_clickstream_event():
    return {
        'user_id': random.choice(USER_POOL),
        'ip_address': fake.ipv4(),
        'action': random.choices(ACTIONS, weights=ACTION_WEIGHTS, k=1)[0],
        'timestamp': datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
    }

if __name__ == '__main__':
    print(f"[*] Starting Kafka Producer streaming to topic '{TOPIC_NAME}' on {BOOTSTRAP_SERVERS[0]}...")
    print("[*] Press Ctrl+C to terminate.")
    try:
        while True:
            payload = generate_clickstream_event()
            producer.send(TOPIC_NAME, value=payload)
            print(f"[PRODUCER] Sent -> {payload}")
            time.sleep(0.1)
    except KeyboardInterrupt:
        print("\n[*] Stopping producer...")
    finally:
        producer.flush()
        producer.close()
        print("[*] Producer closed cleanly.")
