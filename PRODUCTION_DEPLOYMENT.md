# Production Deployment Guide

## Overview
This guide covers deploying the O7C Hub Player Portal to Vercel for production use.

## Prerequisites
- ✅ Firebase project configured (`o7chub`)
- ✅ Vercel account with GitHub integration
- ✅ Domain configured (if using custom domain)

## Environment Variables for Production

Set these in Vercel Dashboard → Settings → Environment Variables:

### Firebase Configuration
```
VITE_FIREBASE_API_KEY=AIzaSyBo12T0l0R9HB7D5No4zJ26bw12qR2S7Ss
VITE_FIREBASE_AUTH_DOMAIN=o7chub.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=o7chub
VITE_FIREBASE_STORAGE_BUCKET=o7chub.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=7529358023
VITE_FIREBASE_APP_ID=1:7529358023:web:1f02e97b588707d8c714e2
VITE_FIREBASE_MEASUREMENT_ID=G-2RM8DGS4DZ
```

### Chat System
```
VITE_CHAT_ENCRYPTION_KEY=your-32-character-encryption-key-here
```

### Optional Services
```
REACT_APP_SENTRY_DSN=your-sentry-dsn-for-error-tracking
HUGGINGFACE_API_TOKEN=your-huggingface-token-for-ai-features
```

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "feat: production-ready player portal with signup"
git push origin main
```

### 2. Deploy to Vercel
- Connect GitHub repository to Vercel
- Set environment variables in Vercel dashboard
- Deploy automatically on push

### 3. Configure Firebase
- Add production domain to Firebase authorized domains
- Update CORS settings if needed
- Verify authentication works in production

## Features Included
- ✅ User authentication (login/signup)
- ✅ Firebase integration
- ✅ Player/Parent role management
- ✅ Responsive design
- ✅ Error handling
- ✅ Security headers
- ✅ SPA routing

## Post-Deployment Checklist
- [ ] Test signup flow
- [ ] Test login flow
- [ ] Verify Firebase authentication
- [ ] Check console for errors
- [ ] Test on mobile devices
- [ ] Verify security headers
- [ ] Test cross-app navigation

## Monitoring
- Firebase Console for authentication metrics
- Vercel Analytics for performance
- Browser console for client-side errors
- Sentry (if configured) for error tracking

## Support
For issues with deployment or configuration, check:
1. Vercel deployment logs
2. Firebase Console authentication logs
3. Browser developer tools console
4. Network tab for failed requests