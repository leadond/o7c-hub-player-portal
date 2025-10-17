# Player Portal

The player-facing application for the O7C (Ohio College Coaches) ecosystem, providing players and parents with tools to manage profiles, track recruitment, and communicate with coaches.

## Features

- **Player Profiles**: Complete player profiles with photos, contact information, and academic details
- **Recruitment Tracking**: Monitor college interest and communication history
- **Document Management**: Upload and manage school records, transcripts, and highlight videos
- **Team Management**: View team assignments and tournament participation
- **Calendar Integration**: Track practice schedules and game events
- **Communication Hub**: Direct messaging with coaches and team administrators
- **Financial Portal**: View payment history and manage team fees

## Tech Stack

- **Frontend**: React 18 with Vite
- **Routing**: React Router v7
- **UI Components**: Custom component library with Tailwind CSS
- **State Management**: React Context API
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **APIs**: Base44, HuggingFace, Brevo (email), Square (payments)
- **Deployment**: Vercel

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project with Firestore enabled

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your actual values

# Start development server
npm run dev
```

### Build

```bash
npm run build
```

### Testing

```bash
npm test
npm run test:ui  # Visual test runner
```

## Environment Variables

See `.env.example` for all required environment variables. Key configurations include:

- **Firebase**: Authentication and database
- **API Keys**: Base44, HuggingFace, Brevo, Square
- **Analytics**: Google Analytics, Sentry, LogRocket (optional)

## Deployment

This application is configured for deployment on Vercel with the following settings:

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: 18.x
- **Framework**: Vite (custom configuration)

### Vercel Configuration

The `vercel.json` file includes:
- Custom build settings for monorepo structure
- Security headers and CSP policies
- API function configuration
- Redirect rules for HTTPS enforcement

## Project Structure

```
packages/player-portal/
├── src/
│   ├── components/     # Reusable UI components
│   │   └── player/     # Player-specific components
│   ├── pages/         # Page components
│   ├── contexts/      # React contexts
│   ├── utils/         # Utility functions
│   └── lib/           # Library configurations
├── api/               # Vercel serverless functions (shared)
├── public/            # Static assets
├── vercel.json        # Vercel deployment config
├── .vercelignore      # Files to exclude from deployment
└── package.json
```

## Contributing

1. Follow the existing code style and patterns
2. Write tests for new features
3. Update documentation as needed
4. Ensure all environment variables are properly documented

## Security

- All API keys are stored server-side only
- Client-side environment variables are prefixed with `VITE_`
- Sensitive operations use serverless functions
- Content Security Policy headers are enforced

## Support

For support or questions, please contact the O7C development team.