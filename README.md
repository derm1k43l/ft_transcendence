# ft_transcendence - Advanced Web Ping Pong Game

A real-time multiplayer Pong game with chat features, user profiles, authentication, and tournament functionality.

## Modules
### Web:
- **Major**: Fastify with Node.js backend framework
- **Minor**: SQLite database integration

### User Management:
- **Major**: Standard user management (registration, profiles, avatars, stats)
- **Major**: Google Sign-in authentication

### Gameplay:
- **Major**: Multiplayer (more than 2 players in the same game).
- **Minor**: Game customization options
- **Major**: Live chat system

### AI-Algo:
- **Major**: AI opponent with strategic gameplay
- **Minor**: User and game statistics dashboards

### Accessibility:
- **Minor**: Cross-device compatibility
- **Minor**: Multi-browser support

8,5 > 7

## Table of Contents
- [Technologies](#technologies)
- [Features](#features)
- [Project Structure](#getting-started)
- [Configuration](#configuration)

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
- **Framework**: Fastify with Node.js
- **Database**: SQLite
- **Authentication**: JWT, Google OAuth 2.0, 2FA

### DevOps
- **Containerization**: Docker & Docker Compose
- **Build System**: Makefile

### Live Chat System
Our chat implementation allows users to:
- Send and receive direct messages through the application
- Block unwanted communications from specific users
- Invite friends to play games directly from the chat interface
- Receive tournament notifications and updates
- Access player profiles through convenient links in the chat

## Features

### Core
- Single-page application with browser navigation support
- Responsive design for all devices
- Cross-browser compatibility

### User Experience
- User registration and authentication
- Google Sign-in integration
- Profile customization with avatars
- Friend management system

### Gameplay
- AI opponents with varying difficulty levels
- Tournament system with rankings
- Game customization options
- Match history and statistics

### Social
- Live chat with direct messaging
- User blocking capabilities
- Game invitations through chat
- Player status indicators

### Security
- JWT authentication
- CSRF protection
- Input validation and sanitization

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