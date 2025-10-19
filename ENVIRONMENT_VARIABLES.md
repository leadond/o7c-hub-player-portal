# Environment Variables Documentation

This document lists all environment variables required for the O7C Hub Player Portal application to function properly in production.

## Required Environment Variables

### Firebase Configuration
These variables are required for Firebase authentication, Firestore database, and storage functionality:

```bash
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=1:your_sender_id:web:your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-your_measurement_id
```

### Chat System Configuration
Required for the chat encryption functionality:

```bash
VITE_CHAT_ENCRYPTION_KEY=your_32_character_encryption_key
```

### External Service Configuration (Optional)
These are used for error tracking and monitoring:

```bash
REACT_APP_SENTRY_DSN=your_sentry_dsn_url
```

### API Configuration (Optional)
For external API integrations:

```bash
HUGGINGFACE_API_TOKEN=your_huggingface_token
```

## Environment Variable Setup in Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add each variable with the appropriate value for your environment
4. Ensure all variables are set for Production, Preview, and Development environments as needed

## Development vs Production

### Development
- Uses localhost URLs for cross-app navigation
- May use mock data when Firebase is not configured
- Error tracking is logged to console

### Production
- Uses production URLs for cross-app navigation
- Requires all Firebase variables to be properly configured
- Error tracking uses external services if configured

## Security Notes

- Never commit actual environment variable values to version control
- Use different Firebase projects for development and production
- Rotate API keys regularly
- Ensure CORS settings in Firebase allow your production domain

## Validation

The application will validate environment variables on startup and provide helpful error messages if required variables are missing. Check the browser console for any configuration issues.

## Testing Configuration

To test if your environment variables are properly configured:

1. Deploy to Vercel with all variables set
2. Check the browser console for any Firebase initialization errors
3. Test authentication functionality
4. Verify chat system works (if encryption key is set)
5. Check that cross-app navigation uses correct URLs