package handler

import (
	"encoding/json"
	"net/http"
	"os"
	"time"
)

// Health check endpoint
func Health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", os.Getenv("APP_ORIGIN"))
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	response := map[string]interface{}{
		"status":    "ok",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"version":   "1.0.0",
	}

	json.NewEncoder(w).Encode(response)
}

// Main handler for Vercel serverless functions
func Handler(w http.ResponseWriter, r *http.Request) {
	// Security headers
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("X-Frame-Options", "DENY")
	w.Header().Set("X-XSS-Protection", "1; mode=block")
	w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
	w.Header().Set("Access-Control-Allow-Origin", os.Getenv("APP_ORIGIN"))
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Access-Control-Allow-Credentials", "true")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Route handling
	switch r.URL.Path {
	case "/api/health":
		Health(w, r)
	case "/api/auth/login":
		handleAuthLogin(w, r)
	case "/api/auth/logout":
		handleAuthLogout(w, r)
	case "/api/auth/me":
		handleAuthMe(w, r)
	default:
		http.NotFound(w, r)
	}
}

// TODO: Implementar handlers de autenticación con PostgreSQL
func handleAuthLogin(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNotImplemented)
	json.NewEncoder(w).Encode(map[string]string{
		"error": "Autenticación no configurada. Configure DATABASE_URL.",
	})
}

func handleAuthLogout(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNotImplemented)
	json.NewEncoder(w).Encode(map[string]string{
		"error": "Autenticación no configurada. Configure DATABASE_URL.",
	})
}

func handleAuthMe(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNotImplemented)
	json.NewEncoder(w).Encode(map[string]string{
		"error": "Autenticación no configurada. Configure DATABASE_URL.",
	})
}
