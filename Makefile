# Container definitions
NAME = ./docker-compose.yml

# Increase timeout for docker-compose
export COMPOSE_HTTP_TIMEOUT=200

# Default target
all: setup_env setup_ssl start_docker start_containers

# Generate SSL certificates if they don't exist
setup_ssl:
	@if [ ! -f "certs/priv-key.pem" ] || [ ! -f "certs/certificate.pem" ]; then \
		echo "Executing ssl script..."; \
		./setup-ssl.sh; \
	fi

# Make sure .env file exists
setup_env:
	@if [ ! -f ".env" ]; then \
		echo "Creating .env file from .env.example..."; \
		cp .env.example .env; \
		echo "Generated random JWT secret..."; \
		echo "JWT_SECRET=$$(openssl rand -hex 32)" >> .env; \
		echo "Please update any other values in .env with your own credentials"; \
	fi


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

# set up docker in goinfre for people using dorker
docker_goinfre:
		@rm -rf /goinfre/${USER}/docker/com.docker.docker;
		@rm -rf /goinfre/${USER}/docker/com.docker.helper;
		@rm -rf /goinfre/${USER}/docker/.docker;
		@unlink ~/Library/Containers/com.docker.docker &>/dev/null || true;
		@unlink ~/Library/Containers/com.docker.helper &>/dev/null || true;
		@unlink ~/.docker &>/dev/null || true;
		@rm -rf ~/Library/Containers/com.docker.docker ~/Library/Containers/com.docker.helper ~/.docker;
		@mkdir -p /goinfre/${USER}/docker/com.docker.docker/Data;
		@mkdir -p /goinfre/${USER}/docker/com.docker.helper;
		@mkdir -p /goinfre/${USER}/docker/.docker;
		@ln -sf /goinfre/${USER}/docker/com.docker.docker ~/Library/Containers/com.docker.docker;
		@ln -sf /goinfre/${USER}/docker/com.docker.helper ~/Library/Containers/com.docker.helper;
		@ln -sf /goinfre/${USER}/docker/.docker ~/.docker;

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

.PHONY: all setup_env setup_ssl start_docker docker_goinfre start_containers frontend_dev backend_dev down fclean re ps db logs_frontend logs_backend logs_database
