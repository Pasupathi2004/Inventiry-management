# 🚀 Vercel Deployment Guide (File-based Storage)

## Quick Deployment Steps

### 1. Deploy to Vercel
1. Go to [Vercel](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your `Inventiry-management` repository
5. Configure settings:
   - Framework: "Other"
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### 2. Set Environment Variables
Add these in Vercel project settings:

```
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
CORS_ORIGIN=https://your-app-name.vercel.app
VITE_API_URL=https://your-app-name.vercel.app/api
```

### 3. Deploy
- Click "Deploy"
- Wait for build to complete
- Your app will be live at `https://your-app-name.vercel.app`

## Features
✅ File-based JSON storage (no database setup needed)
✅ Socket.IO real-time updates
✅ Full inventory management
✅ User authentication
✅ Analytics and reporting
✅ Bulk upload functionality

## Default Login
- Username: `pasu`
- Password: `123`

## Testing
1. Visit your Vercel URL
2. Login with default credentials
3. Test all features
4. Check API health: `/api/health`

## Notes
- Data is stored in JSON files on Vercel
- Socket.IO works for real-time updates
- No external database required
- Simple and fast deployment 