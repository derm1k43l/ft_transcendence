# Container definitions
NAME = ./srcs/docker-compose.yml
DATA_PATH = $(HOME)/data

# Directories to create
FRONTEND_DATA = $(DATA_PATH)/frontend
BACKEND_DATA = $(DATA_PATH)/backend
DATABASE_DATA = $(DATA_PATH)/database

# Increase timeout for docker-compose
export COMPOSE_HTTP_TIMEOUT=200


# Default target
all: start_docker create_dirs start_containers

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

# Create necessary directories
create_dirs:
	@echo "Creating data directories..."
	mkdir -p $(FRONTEND_DATA) $(BACKEND_DATA) $(DATABASE_DATA)
	chmod -R 777 $(FRONTEND_DATA) $(BACKEND_DATA) $(DATABASE_DATA)

# Start all containers
start_containers:
	@echo "Starting all containers..."
	@docker-compose -f $(NAME) up --build -d

# Start only specific components
frontend: start_docker
	@echo "Building and starting frontend..."
	@docker-compose -f $(NAME) up --build -d frontend

backend: start_docker
	@echo "Building and starting backend..."
	@docker-compose -f $(NAME) up --build -d backend

database: start_docker
	@echo "Building and starting database..."
	@docker-compose -f $(NAME) up --build -d database

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
	@rm -rf $(DATA_PATH)
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

.PHONY: all create_dirs start_containers frontend backend database frontend_dev down fclean re ps logs_frontend logs_backend logs_database