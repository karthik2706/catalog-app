# Scripts Directory

This directory contains all utility scripts organized by category.

## 📁 Directory Structure

### 🚀 [Setup](./setup/)
Initial setup and installation scripts.

- **[setup.sh](./setup/setup.sh)** - Complete project setup (dependencies, database, seeding)

### 🚢 [Deployment](./deployment/)
Deployment and production migration scripts.

- **[deploy.sh](./deployment/deploy.sh)** - Vercel deployment script
- **[run-production-migration.sh](./deployment/run-production-migration.sh)** - Production database migration

### 🗄️ [Database](./database/)
Database backup, copy, and management scripts.

- **[backup-prod-db.sh](./database/backup-prod-db.sh)** - Backup production database locally
- **[copy-prod-to-local.sh](./database/copy-prod-to-local.sh)** - Copy production database to local

### 🔧 [Services](./services/)
Service management and startup scripts.

- **[start-embedding-service.sh](./services/start-embedding-service.sh)** - Start CLIP embedding service
- **[start-embedding-service-fastapi.sh](./services/start-embedding-service-fastapi.sh)** - Start FastAPI embedding service

### 📝 TypeScript Scripts

TypeScript utility scripts (run with `tsx` or `npm run`):

- **backup-prod-db.ts** - Production database backup (TypeScript version)
- **backup-s3-bucket.ts** - S3 bucket backup
- **copy-prod-to-local.ts** - Copy production to local database
- **check-migrations-prod.ts** - Check production migrations
- And more... (see [package.json](../package.json) for all npm scripts)

## 🎯 Quick Reference

### Setup
```bash
./scripts/setup/setup.sh
```

### Deployment
```bash
./scripts/deployment/deploy.sh
./scripts/deployment/run-production-migration.sh [DATABASE_URL]
```

### Database Operations
```bash
# Backup production database
./scripts/database/backup-prod-db.sh

# Copy production to local
./scripts/database/copy-prod-to-local.sh
```

### Services
```bash
# Start embedding service
./scripts/services/start-embedding-service.sh
./scripts/services/start-embedding-service-fastapi.sh
```

### NPM Scripts
```bash
# Database operations
npm run db:backup-prod      # Backup production database
npm run db:copy-prod         # Copy production to local
npm run s3:backup            # Backup S3 bucket

# Development
npm run dev                  # Start development server
npm run build                # Build for production
```

## 📋 Script Categories

| Category | Purpose | Scripts |
|----------|---------|---------|
| **Setup** | Initial project setup | setup.sh |
| **Deployment** | Production deployment | deploy.sh, run-production-migration.sh |
| **Database** | Database operations | backup-prod-db.sh, copy-prod-to-local.sh |
| **Services** | Service management | start-embedding-service*.sh |
| **TypeScript** | Advanced utilities | Various .ts files |

## 🔒 Security Notes

- Production scripts require proper credentials
- Database scripts connect to production databases (read-only operations)
- Always verify environment variables before running production scripts
- Backup scripts create local copies - ensure adequate disk space

## 📚 Related Documentation

- [Setup Guides](../docs/setup/) - Configuration documentation
- [Deployment Guide](../docs/deployment/VERCEL_DEPLOYMENT.md) - Deployment instructions
- [Database Backup Setup](../docs/setup/DATABASE_BACKUP_SETUP.md) - Backup configuration
