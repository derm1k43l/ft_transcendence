# ft_transcendence - Advanced Web Ping Pong Game

A real-time multiplayer Pong game with chat features, user profiles, authentication, and tournament functionality.

## Modules
 - Web: ◦ Major module: Use a framework to build the backend.
        ◦ Minor module: Use a database for the backend.
- User Management:  ◦ Major module: Standard user management, authentication, users across tournaments.
                    ◦ Major module: Implementing a remote authentication.
- Gameplay and user experience: ◦ Major module: Remote players.
                                ◦ Minor module: Game customization options.
                                ◦ Major module: Live chat.
- AI-Algo:  ◦ Major module: Introduce an AI opponent.
            ◦ Minor module: User and game stats dashboards.
- Cybersecurity: ◦ Minor module: GDPR compliance options with user anonymization, local data management, and Account Deletion.
                 ◦ Major module: Implement Two-Factor Authentication (2FA) and JWT.
- Accessibility:  ◦ Minor module: Support on all devices.
                  ◦ Minor module: Expanding browser compatibility.

## Table of Contents
- [Technologies](#technologies)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Development](#development)
- [Security Features](#security-features)

## Technologies

### Frontend
- **Language**: TypeScript
- **UI**: Custom CSS with responsive design
- **Architecture**: Single Page Application (SPA)
- **Libraries**:
  - Chart.js for data visualization
  - FontAwesome for icons
  - No heavy frameworks - built with vanilla TS/JS

### Backend 
[Backend details to be added when completed]

### DevOps
- **Containerization**: Docker & Docker Compose
- **Build System**: Makefile

## Features
- Single-page application (SPA)
- User authentication and profile management
- Real-time multiplayer Pong game
- Chat functionality
- Tournament system
- Mobile-responsive design

## Project Structure


## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js and npm (for local development)

## Installation
- git clone https://github.com/derm1k43l/ft_transcendence
- cd ft_transcendence
- make
- visit http://localhost:8080

## Commits format
- \+ | Added something 
- ~ | Modified something
- \- | Removed something

## Security Features

- JWT for secure authentication
- CSRF protection
- Two-factor authentication (2FA)
- Input validation and sanitization
- Secure WebSockets for real-time communication
