# Container definitions
NAME = ./docker-compose.yml

# Increase timeout for docker-compose
export COMPOSE_HTTP_TIMEOUT=200

# Default target
all: start_docker start_containers

# make sure docker daemon is running
start_docker:
	@if ! docker info > /dev/null 2>&1; then \
		echo "Starting Docker..."; \
		open -a Docker; \
		until docker info > /dev/null 2>&1; do \
			sleep 1; \
		done; \
		echo "Docker is ready."; \
	fi

# Start all containers
start_containers:
	@echo "Starting all containers..."
	@docker-compose -f $(NAME) up --build -d

# Frontend development commands
frontend_dev:
	@echo "Building frontend..."
	@echo "Starting frontend development server..."
	cd srcs/frontend && npm run build && npm run serve:local

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

# Container logs for each service
logs_frontend: start_docker
	@docker-compose -f $(NAME) logs frontend

logs_backend: start_docker
	@docker-compose -f $(NAME) logs backend

logs_database: start_docker
	@docker-compose -f $(NAME) logs database

.PHONY: all start_docker start_containers frontend_dev down fclean re ps logs_frontend logs_backend logs_database
