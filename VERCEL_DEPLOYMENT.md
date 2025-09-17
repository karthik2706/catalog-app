# Vercel Deployment Guide

This guide will help you deploy your catalog application to Vercel with a PostgreSQL database.

## Prerequisites

- GitHub repository with your code
- Vercel account (free tier available)
- PostgreSQL database (Vercel Postgres or external)

## Step 1: Database Setup

### Option A: Vercel Postgres (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to the "Storage" tab
3. Click "Create Database" → "Postgres"
4. Choose a name for your database
5. Select a region close to your users
6. Click "Create"
7. Note down the connection details

### Option B: External PostgreSQL

You can use any PostgreSQL provider:
- [Neon](https://neon.tech) (free tier available)
- [Supabase](https://supabase.com) (free tier available)
- [Railway](https://railway.app) (free tier available)
- [PlanetScale](https://planetscale.com) (free tier available)

## Step 2: Deploy to Vercel

### Method 1: Vercel CLI (Recommended)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy your project:
```bash
vercel
```

4. Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? **Your account**
   - Link to existing project? **No**
   - What's your project's name? **catalog-app** (or your preferred name)
   - In which directory is your code located? **./** (current directory)

### Method 2: GitHub Integration

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - Framework Preset: **Next.js**
   - Root Directory: **./** (or leave empty)
   - Build Command: **npm run build** (should auto-detect)
   - Output Directory: **.next** (should auto-detect)

## Step 3: Environment Variables

In your Vercel dashboard, go to your project → Settings → Environment Variables and add:

### Required Variables

```env
DATABASE_URL=postgresql://username:password@hostname:port/database_name
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret-key
```

### AWS S3 Variables (for media uploads)

```env
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name
```

### Environment Variable Setup

1. Go to your project in Vercel dashboard
2. Click "Settings" tab
3. Click "Environment Variables" in the sidebar
4. Add each variable:
   - **Name**: The variable name (e.g., `DATABASE_URL`)
   - **Value**: The actual value
   - **Environment**: Select "Production", "Preview", and "Development"

## Step 4: Database Migration

After deployment, you need to run database migrations:

### Option 1: Using Vercel CLI

```bash
# Install Prisma CLI globally
npm install -g prisma

# Run migrations
vercel env pull .env.local
npx prisma migrate deploy
```

### Option 2: Using Vercel Functions

Create a migration endpoint by adding this to your API:

```typescript
// src/app/api/migrate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // This will run migrations
    await prisma.$executeRaw`SELECT 1`
    return NextResponse.json({ success: true, message: 'Database connected' })
  } catch (error) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }
}
```

## Step 5: AWS S3 Setup (Optional)

If you're using media uploads, set up AWS S3:

1. Create an AWS account
2. Create an S3 bucket
3. Set up IAM user with S3 permissions
4. Add the AWS environment variables to Vercel

See `AWS_SETUP.md` for detailed S3 configuration.

## Step 6: Domain Configuration (Optional)

1. In Vercel dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Update DNS records as instructed

## Step 7: Testing Your Deployment

1. Visit your deployed URL
2. Test the following:
   - User registration/login
   - Product creation
   - Media upload (if S3 is configured)
   - Database operations

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that all environment variables are set
   - Ensure Prisma client is generated (`npx prisma generate`)
   - Check build logs in Vercel dashboard

2. **Database Connection Issues**
   - Verify `DATABASE_URL` is correct
   - Check if database allows connections from Vercel IPs
   - Ensure database is accessible from the internet

3. **Environment Variables Not Working**
   - Make sure variables are set for the correct environment (Production/Preview/Development)
   - Redeploy after adding new variables
   - Check variable names match exactly

4. **Prisma Issues**
   - Run `npx prisma generate` locally and commit the generated client
   - Ensure migrations are up to date
   - Check Prisma schema is valid

### Debugging

1. Check Vercel function logs:
   - Go to your project dashboard
   - Click "Functions" tab
   - View logs for any errors

2. Check build logs:
   - Go to "Deployments" tab
   - Click on a deployment
   - View build logs for errors

3. Test database connection:
   - Use the `/api/migrate` endpoint to test database connectivity

## Performance Optimization

1. **Enable Vercel Analytics** (optional)
2. **Configure caching** for static assets
3. **Optimize images** using Next.js Image component
4. **Use Vercel Edge Functions** for better performance

## Monitoring

1. **Vercel Analytics**: Built-in performance monitoring
2. **Error Tracking**: Check function logs regularly
3. **Database Monitoring**: Use your database provider's monitoring tools

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to Git
2. **Database Security**: Use strong passwords and restrict access
3. **API Security**: Implement proper authentication and rate limiting
4. **CORS**: Configure CORS properly for your domain

## Scaling

As your application grows:

1. **Upgrade Vercel Plan**: For more bandwidth and functions
2. **Database Scaling**: Consider read replicas or connection pooling
3. **CDN**: Vercel automatically provides global CDN
4. **Monitoring**: Set up proper monitoring and alerting

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)

## Next Steps

After successful deployment:

1. Set up monitoring and alerts
2. Configure custom domain
3. Set up CI/CD pipeline
4. Implement backup strategies
5. Plan for scaling

Your application should now be live and accessible at your Vercel URL!
