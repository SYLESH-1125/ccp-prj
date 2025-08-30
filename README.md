# CCP - Citizen Center Platform

A modern, mobile-responsive citizen service platform built with Next.js 15, Firebase, and Tailwind CSS.

## Features

- 🏛️ **Admin Dashboard** - Complete management interface
- 👥 **Citizen Portal** - Report issues and track status
- 📱 **Mobile-First Design** - Responsive across all devices
- 🔐 **Firebase Authentication** - Secure user management
- 📊 **Real-time Updates** - Live status tracking
- 🗺️ **Interactive Maps** - Playground and location services

## Live Demo

- **Production**: [Your Vercel URL]
- **Development**: `npm run dev`

## Tech Stack

- **Framework**: Next.js 15.2.4
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Styling**: Tailwind CSS + shadcn/ui
- **Deployment**: Vercel

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

Create a `.env.local` file with your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Firebase Setup

1. Enable Authentication (Email/Password)
2. Create Firestore Database
3. Set up Storage Rules
4. Configure Security Rules

## Mobile Features

- Responsive design for all screen sizes
- Touch-optimized interfaces
- Mobile navigation patterns
- Optimized loading states

## Deployment

The app is configured for easy deployment on Vercel with automatic builds and environment variable management.
