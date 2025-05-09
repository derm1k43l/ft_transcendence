# Container definitions
NAME = ./docker-compose.yml

# Increase timeout for docker-compose
export COMPOSE_HTTP_TIMEOUT=200

# Default target
all: start_docker start_containers

# make sure docker daemon is running
start_docker:
	@if ! docker stats --no-stream > /dev/null 2>&1; then \
		printf "Docker is starting up..."; \
		open -g -a Docker; \
		while ! docker stats --no-stream > /dev/null 2>&1; do \
			printf "."; \
			sleep 1; \
		done; \
		echo ""; \
	fi

# Start all containers
start_containers:
	@echo "Starting all containers..."
	@docker-compose -f $(NAME) up --build -d

# Frontend development commands
frontend_dev:
	@echo "Building frontend..."
	@echo "Starting frontend development server..."
	cd frontend && npm install && npm run build && npm run serve:local

# Backend development commands
backend_dev:
	@echo "Building backend..."
	@echo "Starting backend development server..."
	cd backend && npm install && node server

# Stop and remove containers (keep volumes)
down: start_docker
	@echo "Stopping containers..."
	@docker-compose -f $(NAME) down

# Complete cleanup
fclean: start_docker down
	@echo "Removing containers, volumes, networks, and images..."
	@docker-compose -f $(NAME) down --volumes --rmi all
	@docker volume prune -f
	@docker network prune -f
	@docker system prune -af

# Rebuild everything
re: fclean all

# Show container status
ps: start_docker
	@docker-compose -f $(NAME) ps

# Delete DataBase
db:
	@echo "Removing database..."
	rm -rf backend/db

# Container logs for each service
logs_frontend: start_docker
	@docker-compose -f $(NAME) logs frontend

logs_backend: start_docker
	@docker-compose -f $(NAME) logs backend

logs_database: start_docker
	@docker-compose -f $(NAME) logs database

.PHONY: all start_docker start_containers frontend_dev backend_dev down fclean re ps db logs_frontend logs_backend logs_database
