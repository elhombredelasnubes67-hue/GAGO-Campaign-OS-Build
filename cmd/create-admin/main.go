// GAGO CAMPAIGN OS — Comando para crear el primer administrador
// Uso: go run cmd/create-admin/main.go --email admin@empresa.com --name "Nombre" --org "Organización"

package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"golang.org/x/crypto/argon2"
)

func main() {
	email := flag.String("email", "", "Correo del administrador")
	name := flag.String("name", "", "Nombre completo")
	org := flag.String("org", "", "Nombre de la organización")
	flag.Parse()

	if *email == "" || *name == "" || *org == "" {
		fmt.Println("Uso: go run cmd/create-admin/main.go --email <email> --name <nombre> --org <organización>")
		os.Exit(1)
	}

	// Solicitar contraseña de forma segura
	fmt.Print("Contraseña: ")
	// En producción, usar golang.org/x/term.ReadPassword(int(os.Stdin.Fd()))
	// Aquí se muestra el concepto:
	var password string
	fmt.Scanln(&password)

	if len(password) < 12 {
		log.Fatal("La contraseña debe tener al menos 12 caracteres")
	}

	// Hash con Argon2id
	salt := []byte("random-salt-change-in-production")
	hash := argon2.IDKey([]byte(password), salt, 1, 64*1024, 4, 32)

	fmt.Printf("\nAdministrador creado:\n")
	fmt.Printf("  Email: %s\n", *email)
	fmt.Printf("  Nombre: %s\n", *name)
	fmt.Printf("  Organización: %s\n", *org)
	fmt.Printf("  Hash: %x\n", hash)
	fmt.Printf("\nEjecutar SQL:\n")
	fmt.Printf("  INSERT INTO organizations (name) VALUES ('%s');\n", *org)
	fmt.Printf("  INSERT INTO users (organization_id, email, name, password_hash, role)\n")
	fmt.Printf("  VALUES ((SELECT id FROM organizations WHERE name='%s'), '%s', '%s', '\\x%x', 'admin');\n",
		*org, *email, *name, hash)
	fmt.Println("\n⚠ Eliminar este comando del historial de shell.")
}
