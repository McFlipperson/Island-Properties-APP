# GEO Expert Authority App

## Project Overview

This is a Philippines real estate expert authority lead generation system designed to generate qualified consultation requests through AI citations and expert content positioning across multiple platforms.

## Current Status

**Successfully deployed and running** ✅

- **Backend API**: Express.js with TypeScript running on port 3001
- **Frontend**: React with TypeScript and Tailwind CSS running on port 5000
- **Database**: PostgreSQL with Drizzle ORM schema implemented
- **Workflows**: Configured and running both services concurrently

## Architecture

### Technology Stack
- **Backend**: Node.js, Express.js, TypeScript, PostgreSQL, Drizzle ORM
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Query
- **Database**: PostgreSQL with expert personas, platform accounts, and content tables
- **Build System**: TypeScript compilation with Vite bundling

### Key Components

1. **Expert Personas Management**: Create and manage Philippines real estate expert profiles
2. **GEO Platform Accounts**: Manage social media accounts across Medium, Reddit, Quora, Facebook, LinkedIn
3. **Authority Content**: AI citation-optimized content creation and management
4. **Lead Generation Tracking**: Consultation request and referral attribution

## Database Schema

Core tables implemented:
- `admin_users` - System administrators
- `expert_personas` - Philippines real estate expert profiles
- `geo_platform_accounts` - Social media platform accounts
- `authority_content_publications` - Expert content pieces
- `proxy_assignments` - IP management for expert authenticity

## API Endpoints

Base URL: `/api`

- **Expert Personas**: `/api/expert-personas`
- **Platform Accounts**: `/api/geo-platform-accounts` 
- **Authority Content**: `/api/authority-content`

All endpoints support CRUD operations with proper validation and error handling.

## Recent Changes

**2024-09-14**: Initial project setup completed
- Database schema created and migrated
- Backend API with TypeScript and Express.js
- React frontend with expert dashboard
- Workflows configured for development environment
- Deployment configuration set for production

## User Preferences

- Clean, professional interface optimized for expert authority building
- Focus on Philippines real estate market specialization
- AI citation optimization as primary growth strategy
- Lead generation through expert consultation requests

## Next Steps

1. Implement expert persona creation forms
2. Add platform account connection workflows
3. Build content creation and optimization tools
4. Integrate proxy management system
5. Add analytics and performance tracking dashboards

## Development

- **Development**: `npm run dev` (runs both frontend and backend)
- **Build**: `npm run build` 
- **Database**: `npm run db:push` for schema updates

## Environment

- **Node.js**: 20+
- **Database**: PostgreSQL (configured via DATABASE_URL)
- **Frontend Port**: 5000 (required for Replit proxy)
- **Backend Port**: 3001