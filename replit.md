# Laboratory Management System

## Overview

This is a comprehensive Laboratory Management System built for healthcare facilities to manage patient information, medical tests, and administrative operations. The application provides secure admin authentication, patient management, various medical test types (CBC, LFT, RFT, Lipid Profile, Blood Sugar, Thyroid, Urine Analysis, Cardiac Markers, Electrolytes), and features editable ID systems with password protection for enhanced security.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with shadcn/ui design system for consistent, accessible components
- **Styling**: Tailwind CSS with custom medical theme colors and variables
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for full-stack type safety
- **Session Management**: Express sessions with configurable storage (memory-based with PostgreSQL session store support)
- **Authentication**: BCrypt for password hashing with session-based authentication
- **API Design**: RESTful API structure with consistent error handling middleware

### Database Layer
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured via Neon serverless)
- **Migrations**: Drizzle Kit for schema management and migrations
- **Schema Design**: Normalized tables for admin users, patients, tests, and audit logging

### Security Features
- **Password Protection**: BCrypt hashing with salt rounds
- **Session Security**: HTTP-only cookies with secure flags in production
- **ID Edit Protection**: Admin password verification required for Patient ID and Test ID modifications
- **Audit Logging**: Complete change tracking for ID modifications with user attribution

### Development Tools
- **Build System**: Vite for fast development and optimized production builds
- **Development Server**: Hot module replacement and error overlay integration
- **Code Quality**: TypeScript strict mode with comprehensive type checking
- **Styling**: PostCSS with Tailwind CSS for utility-first styling

### Application Features
- **Auto-generated IDs**: Sequential patient IDs (PAT001, PAT002) and test IDs (TEST001, TEST002)
- **Protected ID Editing**: Password-verified ID modification with audit trail
- **Multi-test Support**: Nine different medical test types with customized input forms
- **Dashboard Analytics**: Real-time statistics for tests, patients, and critical results
- **Responsive Design**: Mobile-first approach with professional medical theme

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database operations and schema management

### UI and Styling
- **Radix UI**: Accessible component primitives for complex UI interactions
- **Tailwind CSS**: Utility-first CSS framework with custom medical color scheme
- **Lucide React**: Medical and laboratory-themed icon library

### Authentication and Security
- **BCryptjs**: Password hashing and verification
- **Express Session**: Session management with PostgreSQL session store support

### Development and Build Tools
- **Vite**: Fast build tool with React plugin support
- **TypeScript**: Type safety across frontend and backend
- **React Query**: Server state management and caching
- **React Hook Form**: Form handling with Zod schema validation

### Hosting and Runtime
- **Express.js**: Web server framework for API endpoints
- **Node.js**: JavaScript runtime environment
- **Replit Integration**: Development environment with cartographer plugin support