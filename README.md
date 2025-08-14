# LabDesk - Laboratory Management System

A modern full-stack web application for managing laboratory operations, built with React, TypeScript, Express, and SQLite.

## 🚀 Quick Start

### Prerequisites

Before running this project, make sure you have:

- **Node.js** (version 16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download here](https://git-scm.com/)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <your-github-repo-url>
   cd LabDesk
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   # Copy the example environment file
   cp env.example .env
   ```
   
   Edit the `.env` file and update the following variables:
   ```env
   # Session Configuration (required)
   SESSION_SECRET=your_very_secure_session_secret_key_here
   
   # Environment
   NODE_ENV=development
   ```

4. **Initialize the database:**
   ```bash
   # Generate database schema
   npm run db:generate
   
   # Apply migrations to create tables
   npm run db:push
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to `http://localhost:5000` (or the port shown in your terminal)

## 📁 Project Structure

```
LabDesk/
├── client/          # React frontend application
├── server/          # Express backend API
├── shared/          # Shared types and schemas
├── data/            # SQLite database files
├── migrations/      # Database migration files
├── api/             # API route handlers
└── dist/            # Built production files
```

## 🛠️ Available Scripts

- **`npm run dev`** - Start development server with hot reload
- **`npm run build`** - Build the application for production
- **`npm run start`** - Start the production server
- **`npm run db:generate`** - Generate database migrations
- **`npm run db:push`** - Apply database changes
- **`npm run db:studio`** - Open Drizzle Studio (database GUI)
- **`npm run test:db`** - Test database connection

## 🗄️ Database

This project uses **SQLite** as the database with **Drizzle ORM** for type-safe database operations.

- Database file: `./data/labdesk.db`
- Schema: `./shared/schema.ts`
- Migrations: `./migrations/`

### Database Management

```bash
# View your database in a GUI
npm run db:studio

# Reset database (if needed)
rm -rf data/labdesk.db
npm run db:push
```

## 🚀 Deployment

### Local Production Build

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Set the following environment variables in Vercel:
   ```
   SESSION_SECRET=your_secure_session_secret
   NODE_ENV=production
   ```
4. Deploy!

**Note:** For production deployments, you may want to consider using PostgreSQL instead of SQLite for better performance and scalability.

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `SESSION_SECRET` | Secret key for session encryption | Yes | - |
| `NODE_ENV` | Environment mode | No | `development` |

### Port Configuration

The application runs on port `5000` by default. You can change this by setting the `PORT` environment variable.

## 🐛 Troubleshooting

### Common Issues

**Database connection errors:**
- Ensure the `data/` directory exists
- Run `npm run db:push` to create/update database tables

**Port already in use:**
- Change the port in your environment variables
- Or kill the process using the port: `npx kill-port 5000`

**Module not found errors:**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

**Build errors:**
- Ensure all TypeScript errors are resolved
- Run `npm run check` to verify TypeScript compilation

## 📝 Development

### Adding New Features

1. **Database changes:** Update `shared/schema.ts` and run `npm run db:generate`
2. **API routes:** Add new routes in the `api/` directory
3. **Frontend pages:** Add new React components in `client/src/`

### Code Style

This project uses TypeScript for type safety. Make sure to:
- Run `npm run check` before committing
- Follow the existing code structure and naming conventions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test them
4. Commit your changes: `git commit -m 'Add some feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Need Help?

If you encounter any issues:

1. Check this README for common solutions
2. Look at the existing issues on GitHub
3. Create a new issue with detailed information about the problem

---

**Happy coding! 🎉**
