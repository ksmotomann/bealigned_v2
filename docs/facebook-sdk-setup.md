# Facebook SDK Setup Guide

## Overview
The app now uses `react-native-fbsdk-next` for native Facebook sharing with the Weekly Grounding cards.

## Required Configuration

### 1. Get Facebook App ID

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use existing app
3. Get your **App ID** and **Client Token**

### 2. Add Environment Variables

Add to your `.env` file:

```env
EXPO_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id
EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN=your_facebook_client_token
```

### 3. Configure app.json / app.config.js

Add Facebook configuration to your Expo config:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-fbsdk-next",
        {
          "appID": "your_facebook_app_id",
          "clientToken": "your_facebook_client_token",
          "displayName": "BeAligned",
          "scheme": "fb{your_facebook_app_id}",
          "advertiserIDCollectionEnabled": false,
          "autoLogAppEventsEnabled": false,
          "isAutoInitEnabled": true,
          "iosUserTrackingPermission": "This app uses Facebook sharing to let you share your weekly grounding cards."
        }
      ]
    ]
  }
}
```

### 4. Facebook App Dashboard Configuration

In your Facebook App dashboard:

#### iOS Setup:
1. Go to Settings → Basic
2. Add iOS platform
3. Add Bundle ID: `com.bealigned.app` (or your bundle ID)
4. Add iOS App Store ID (when available)

#### Android Setup:
1. Go to Settings → Basic
2. Add Android platform
3. Add Package Name: `com.bealigned.app` (or your package name)
4. Add Key Hash (generated via keytool)

### 5. Rebuild Native Apps

After configuration, rebuild your native apps:

```bash
# For iOS
npx expo prebuild --platform ios
npx expo run:ios

# For Android
npx expo prebuild --platform android
npx expo run:android
```

### 6. Test Facebook Sharing

The Facebook sharing flow:
1. User clicks Facebook button in social media modal
2. App opens Facebook's native Share Dialog with:
   - Weekly Grounding image
   - Message/quote text
3. User can edit and share directly to Facebook

## Fallback Behavior

If Facebook SDK fails or is not configured:
- **Web**: Opens Facebook web share dialog
- **Mobile**: Falls back to Facebook web share via deep link

## Current Implementation

File: `app/(tabs)/dashboard.tsx`

- Uses `ShareDialog.show()` from Facebook SDK for native sharing
- Passes image and message as `ShareLinkContent`
- Gracefully falls back to web sharing if SDK unavailable

## Testing Checklist

- [ ] Facebook App ID configured
- [ ] Environment variables set
- [ ] App rebuilt after config changes
- [ ] Test on iOS device
- [ ] Test on Android device
- [ ] Test web fallback
- [ ] Verify image appears in Facebook composer
- [ ] Verify message text appears correctly
