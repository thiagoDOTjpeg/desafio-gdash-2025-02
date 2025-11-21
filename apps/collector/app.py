import requests
import time
import logging
import sys
import os
import json
from dotenv import load_dotenv
from pathlib import Path
import pika

env_path = Path(__file__).resolve().parents[1] / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=str(env_path))

logging.basicConfig(
  level=logging.INFO,
  format="%(asctime)s %(levelname)s %(message)s",
  handlers=[logging.StreamHandler(sys.stdout)]
)

RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'rabbitmq') 
RABBITMQ_PORT = os.getenv('RABBITMQ_PORT', 5672) 
RABBITMQ_USER = os.getenv('RABBITMQ_USER', os.getenv('RABBITMQ_DEFAULT_USER', 'guest'))
RABBITMQ_PASS = os.getenv('RABBITMQ_PASS', os.getenv('RABBITMQ_DEFAULT_PASS', 'guest'))
QUEUE_NAME = os.getenv('QUEUE_NAME', 'weather_logs_queue')

API_BASE_URL = os.getenv('API_BASE_URL', 'https://api.openweathermap.org/data/2.5/weather?') 
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY", "")
LATITUDE = os.getenv('LATITUDE', '40.7128') 
LONGITUDE = os.getenv('LONGITUDE', '-74.0060') 

INTERVALO_SEGUNDOS = 600 

def fetch_weather_data():
    params = {
        "lat": LATITUDE,
        "lon": LONGITUDE,
        "appid": WEATHER_API_KEY,
        "units": "metric"  
    }
    
    try:
        response = requests.get(API_BASE_URL, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        timestamp = data.get('dt')
        temp_c = data.get('main', {}).get('temp')
        humidity = data.get('main', {}).get('humidity')
        wind_ms = data.get('wind', {}).get('speed')  
        wind_kmh = wind_ms * 3.6 if wind_ms is not None else None
        weather_code = (data.get('weather') or [{}])[0].get('id')
        
        normalized_data = {
            "timestamp": timestamp,
            "location_lat": LATITUDE,
            "location_lon": LONGITUDE,
            "temperature_c": temp_c,
            "humidity_percent": humidity,
            "wind_speed_kmh": wind_kmh,
            "weather_code": weather_code,
            "collected_at": time.time()
        }
        
        logging.info(f"Dados coletados: {normalized_data['temperature_c']}°C")
    
        return json.dumps(normalized_data) 

    except requests.RequestException as e:
        logging.info(f"Erro na requisição da API de clima: {e}")
        return None
    except Exception as e:
        logging.info(f"Erro durante o processamento dos dados: {e}")
        return None
    
def publish_to_queue(json_payload):
    try:
        creds = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
        for _ in range(5): 
            try:
                params = pika.ConnectionParameters(host=RABBITMQ_HOST, port=int(RABBITMQ_PORT), credentials=creds)
                connection = pika.BlockingConnection(params)
                break
            except pika.exceptions.AMQPConnectionError as e:
                logging.warning(f"Falha ao conectar ao RabbitMQ. Tentando novamente em 5s... Erro: {e}")
                time.sleep(5)
        else:
            logging.error("Falha fatal na conexão com RabbitMQ após várias tentativas.")
            return

        channel = connection.channel()

        channel.queue_declare(queue=QUEUE_NAME, durable=True) 

        channel.basic_publish(
            exchange='',
            routing_key=QUEUE_NAME,
            body=json_payload,
            properties=pika.BasicProperties(
                delivery_mode=2,  
                content_type='application/json'
            )
        )
        logging.info(f" [x] Dados de clima enviados para a fila '{QUEUE_NAME}'.")
        connection.close()

    except Exception as e:
        logging.error(f"Erro ao publicar no RabbitMQ: {e}")

def run_collector():
    logging.info(f"Coletor Python iniciado. Enviando para fila '{QUEUE_NAME}' no host '{RABBITMQ_HOST}'...")
    
    while True:
        data_json = fetch_weather_data() 
        
        if data_json:
            publish_to_queue(data_json)
                
        logging.info(f"Aguardando {INTERVALO_SEGUNDOS} segundos para a próxima coleta...")
        time.sleep(INTERVALO_SEGUNDOS)

if __name__ == "__main__":
    run_collector()