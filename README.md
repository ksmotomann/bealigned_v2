# BeAligned App

A cross-platform mobile and web application for guided conflict resolution and compassionate communication, built with Expo and Supabase.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Expo CLI
- Supabase CLI
- iOS Simulator (Mac only) or Android Emulator

### Installation

1. **Clone and install dependencies**
```bash
cd bealigned-app
npm install
```

2. **Set up environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

3. **Link to Supabase project**
```bash
supabase link --project-ref oohrdabehxzzwdmpmcfv
```

4. **Apply database migrations**
```bash
supabase db push
```

5. **Start the development server**
```bash
npm start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator
- `w` for web browser

## 📱 Features

- **7-Step Reflection Process**: Guided journey through conflict resolution
- **Secure Authentication**: Email/password with verification
- **Real-time Chat**: AI-powered conversation guidance
- **Progress Tracking**: Visual step completion and history
- **Multi-platform**: iOS, Android, and Web from single codebase
- **Offline Support**: Session persistence with AsyncStorage

## 🏗️ Architecture

### Frontend
- **Framework**: Expo + React Native
- **Navigation**: Expo Router (file-based)
- **State Management**: React hooks + Supabase realtime
- **Styling**: React Native StyleSheet

### Backend (Supabase)
- **Database**: PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage for documents
- **Realtime**: WebSocket subscriptions
- **Edge Functions**: Serverless API endpoints

## 📁 Project Structure

```
bealigned-app/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication screens
│   ├── (marketing)/       # Public/landing pages
│   ├── (tabs)/            # Main app screens
│   └── _layout.tsx        # Root layout
├── lib/                   # Utilities and configs
│   └── supabase.ts       # Supabase client
├── supabase/             # Backend configuration
│   └── migrations/       # SQL schema migrations
├── assets/               # Images and static files
└── package.json          # Dependencies
```

## 🔐 Security

- Row Level Security (RLS) on all tables
- User data isolation by auth.uid()
- Secure session management
- Environment variables for secrets
- Input validation and sanitization

## 🧪 Testing

```bash
# Run type checking
npm run typecheck

# Run linter
npm run lint

# Run tests (when configured)
npm test
```

## 📝 Development Commands

```bash
# Start development server
npm start

# Run on specific platform
npm run ios
npm run android
npm run web

# Build for production
eas build --platform ios
eas build --platform android
```

## 🚢 Deployment

### Web
```bash
npx expo export:web
# Deploy the web-build folder to your hosting service
```

### Mobile
1. Configure EAS Build
2. Build and submit to app stores
```bash
eas build --platform all
eas submit
```

## 📚 Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Expo Router Documentation](https://expo.github.io/router/docs)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test on all platforms
4. Submit a pull request

## 📄 License

Copyright © 2025 BeAligned. All rights reserved.

## 🆘 Support

For issues or questions, please contact support@bealigned.com