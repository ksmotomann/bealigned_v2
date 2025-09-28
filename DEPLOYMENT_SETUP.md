# BeAligned Deployment Setup

## Environment Variables Needed for Vercel

Please provide the following environment variables for your Vercel deployment:

### 1. Supabase Configuration (Required)
- `SUPABASE_URL` - Your Supabase project URL (e.g., https://xxxxx.supabase.co)
- `SUPABASE_ANON_KEY` - Your Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for backend operations)
- `NEXT_PUBLIC_SUPABASE_URL` - Same as SUPABASE_URL (for frontend)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Same as SUPABASE_ANON_KEY (for frontend)

### 2. OpenAI Configuration (Required)
- `OPENAI_API_KEY` - Your OpenAI API key
- `OPENAI_ASSISTANT_ID` - Your OpenAI Assistant ID (or we can create one)

### 3. Email Configuration (Optional but Recommended)
- `SMTP_HOST` - SMTP server host (e.g., smtp.gmail.com)
- `SMTP_PORT` - SMTP port (e.g., 587)
- `SMTP_SECURE` - true/false for SSL
- `SMTP_USER` - Email username
- `SMTP_PASS` - Email password/app password
- `SMTP_FROM` - From email address

### 4. Application URLs (Will be auto-set by Vercel)
- `VERCEL_URL` - Automatically provided by Vercel
- `NEXT_PUBLIC_API_URL` - Will be your Vercel deployment URL + /api

### 5. Database Configuration
- `DATABASE_URL` - PostgreSQL connection string (if not using Supabase's built-in)

### 6. Authentication
- `JWT_SECRET` - Secret for JWT tokens (generate a random string)
- `SESSION_SECRET` - Secret for session management (generate a random string)

## Vercel Deployment Steps

1. **Create a Vercel Account** (if you haven't already)
   - Go to https://vercel.com

2. **Install Vercel CLI** (optional)
   ```bash
   npm install -g vercel
   ```

3. **Connect GitHub Repository**
   - In Vercel dashboard, click "Import Project"
   - Select your GitHub repository: `ksmotomann/bealigned`

4. **Configure Project Settings**
   - Framework Preset: Create React App
   - Root Directory: `./`
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/build`
   - Install Command: `npm install`

5. **Add Environment Variables**
   - Go to Project Settings > Environment Variables
   - Add all the variables listed above

6. **Deploy Backend Separately (Recommended)**
   - Create a separate Vercel project for the backend API
   - Or use Vercel Functions for serverless deployment

## Required Values from You

Please provide:
1. Your Supabase project URL and keys
2. Your OpenAI API key
3. Your preferred email configuration (optional)
4. Any custom domain you want to use

## API Endpoint Configuration

After deployment, update your frontend to use the correct API URL:
- Production: `https://your-app.vercel.app/api`
- Development: `http://localhost:3001/api`

## Database Setup

Make sure your Supabase database has all the required tables and migrations applied.

## Post-Deployment Checklist

- [ ] Verify all environment variables are set in Vercel
- [ ] Test user authentication
- [ ] Test conversation creation and messaging
- [ ] Test AI Assistant functionality
- [ ] Test email notifications (if configured)
- [ ] Configure custom domain (if desired)
- [ ] Set up monitoring and error tracking