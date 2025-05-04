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
- **Major**: Remote multiplayer functionality
- **Minor**: Game customization options (power-ups, maps)
- **Major**: Live chat system

### AI-Algo:
- **Major**: AI opponent with strategic gameplay
- **Minor**: User and game statistics dashboards

### Cybersecurity:
- **Major**: Two-Factor Authentication (2FA) and JWT implementation
- **Minor**: GDPR compliance with data management options

### Accessibility:
- **Minor**: Cross-device compatibility
- **Minor**: Multi-browser support

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

### GDPR Compliance
Our application respects user privacy rights in accordance with GDPR:

- **Data Transparency**: Users can view all personal data stored about them
- **Right to be Forgotten**: Complete account deletion functionality permanently removes user data
- **Data Portability**: Users can export their data in a standard format
- **Privacy Controls**: Granular settings for visibility of online status, game history, and personal information
- **Consent Management**: Clear privacy notices and consent options for data processing
- **Data Minimization**: Only essential information is collected and stored

## Features

### Core
- Single-page application with browser navigation support
- Responsive design for all devices
- Cross-browser compatibility

### User Experience
- User registration and authentication
- Google Sign-in integration
- Two-factor authentication
- Profile customization with avatars
- Friend management system

### Gameplay
- Real-time multiplayer Pong with latency compensation
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
- Data privacy controls (GDPR compliant)
- Input validation and sanitization
- Secure  WebSockets

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
