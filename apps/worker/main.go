package main

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"os"

	amqp "github.com/rabbitmq/amqp091-go"
)

type WeatherLog struct {
    Timestamp       int64   `json:"timestamp" bson:"timestamp"`
    LocationLat     string  `json:"location_lat" bson:"location_lat"`
    LocationLon     string  `json:"location_lon" bson:"location_lon"`
    TemperatureC    float64 `json:"temperature_c" bson:"temperature_c"`
    HumidityPercent int     `json:"humidity_percent" bson:"humidity_percent"`
    WindSpeedKmh    float64 `json:"wind_speed_kmh" bson:"wind_speed_kmh"`
    WeatherCode     int     `json:"weather_code" bson:"weather_code"`
    CollectedAt     float64 `json:"collected_at" bson:"collected_at"`
}

func main() {
    // Connect to RabbitMQ
    rabbitmqURL := os.Getenv("RABBITMQ_URL")
    if rabbitmqURL == "" {
        rabbitmqURL = "amqp://guest:guest@localhost:5672/"
    }

    conn, err := amqp.Dial(rabbitmqURL)
    if err != nil {
        log.Fatalf("Failed to connect to RabbitMQ: %v", err)
    }
    defer conn.Close()

    ch, err := conn.Channel()
    if err != nil {
        log.Fatalf("Failed to open a channel: %v", err)
    }
    defer ch.Close()

    q, err := ch.QueueDeclare(
        "weather_logs_queue", // name
        true,           // durable
        false,          // delete when unused
        false,          // exclusive
        false,          // no-wait
        nil,            // arguments
    )
    if err != nil {
        log.Fatalf("Failed to declare a queue: %v", err)
    }

    msgs, err := ch.Consume(
        q.Name, // queue
        "",     // consumer
        false,   // auto-ack
        false,  // exclusive
        false,  // no-local
        false,  // no-wait
        nil,    // args
    )
    if err != nil {
        log.Fatalf("Failed to register a consumer: %v", err)
    }

    log.Println("Worker started. Waiting for messages...")

    forever := make(chan bool)

    nestUrl := os.Getenv("NESTJS_API_URL")
    contentType := "application/json"
    if(nestUrl == "") {
        nestUrl = "http://localhost:3000"
    }

    go func() {
        for d := range msgs {
            var weatherLog WeatherLog
            err := json.Unmarshal(d.Body, &weatherLog)
            if err != nil {
                log.Printf("Error parsing message: %v", err)
                d.Nack(false, false) 
                continue
            }

            if weatherLog.LocationLat == "" || weatherLog.LocationLon == "" {
                log.Printf("Invalid data: missing location")
                d.Nack(false, false)
                continue
            }

            body, err := json.Marshal(weatherLog)
            if err != nil {
                log.Printf("Error marshaling body: %v", err)
                d.Nack(false, false)
                continue
            }

            success := false
            for i := 0; i < 3; i++ {
                resp, err := http.Post(nestUrl+"/api/weather/logs", contentType, bytes.NewBuffer(body))
                if err == nil && resp.StatusCode >= 200 && resp.StatusCode < 300 {
                    log.Printf("Processed weather log: %+v", weatherLog)
                    success = true
                    break
                }
                log.Printf("Error sending to API (try %d): %v", i+1, err)
            }

            if success {
                d.Ack(false)
            } else {
                d.Nack(false, true) 
            }
        }
    }()

    <-forever
}