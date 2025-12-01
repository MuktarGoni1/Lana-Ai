# Deployment Guide

## Prerequisites

Before deploying the Lana AI application, ensure you have:

1. Node.js (version 18 or higher)
2. npm (version 8 or higher)
3. A Supabase account and project
4. A Sentry account (for error tracking)
5. Environment variables configured

## Environment Variables

Create a `.env.local` file in the frontend directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_API_BASE=your_api_base_url
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the frontend directory:
   ```
   cd frontend
   ```

3. Install dependencies:
   ```
   npm install
   ```

## Building the Application

To build the application for production:

```
npm run build
```

This will create an optimized production build in the `.next` directory.

## Running the Application

To start the application in production mode:

```
npm start
```

The application will be available at `http://localhost:3000` by default.

## Deployment Options

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure the environment variables in the Vercel dashboard
3. Set the build command to `npm run build`
4. Set the output directory to `.next`
5. Deploy the application

### Docker

1. Build the Docker image:
   ```
   docker build -t lana-ai .
   ```

2. Run the container:
   ```
   docker run -p 3000:3000 lana-ai
   ```

### Traditional Server

1. Build the application:
   ```
   npm run build
   ```

2. Copy the following directories to your server:
   - `.next`
   - `public`
   - `package.json`
   - `next.config.js`

3. Install production dependencies:
   ```
   npm install --production
   ```

4. Start the application:
   ```
   npm start
   ```

## Monitoring and Error Tracking

The application uses Sentry for error tracking. Ensure that the `NEXT_PUBLIC_SENTRY_DSN` environment variable is set correctly.

## Troubleshooting

### Common Issues

1. **Build fails with TypeScript errors**:
   - Check the TypeScript configuration
   - Fix any type errors in the code

2. **Application fails to start**:
   - Verify all environment variables are set correctly
   - Check the Supabase configuration

3. **API calls failing**:
   - Verify the `NEXT_PUBLIC_API_BASE` is set correctly
   - Check network connectivity to the backend

### Logs

Check the application logs for any errors or warnings. In production, logs can be found in:
- Vercel: Vercel dashboard
- Docker: Docker logs
- Traditional server: Server logs

## Maintenance

### Updating Dependencies

1. Check for outdated dependencies:
   ```
   npm outdated
   ```

2. Update dependencies:
   ```
   npm update
   ```

3. Test the application after updating dependencies

### Database Migrations

Any database schema changes should be handled through Supabase migrations.

## Security Considerations

1. Never commit sensitive environment variables to the repository
2. Use HTTPS in production
3. Regularly update dependencies to patch security vulnerabilities
4. Monitor error logs for potential security issues