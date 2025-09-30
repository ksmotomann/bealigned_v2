# URL Configuration for Image Sharing

## Overview

The BeAligned app uses smart runtime detection to automatically determine the correct base URL for image sharing on social media platforms. This system works seamlessly across different deployment environments without requiring manual configuration.

## How It Works

### Development
- **Local testing**: `http://localhost:8081`
- **Automatic detection**: When `window.location.hostname === 'localhost'`
- **No configuration needed**: Works out of the box

### Production Deployments
The system automatically detects common deployment platforms:

- **Vercel**: `*.vercel.app` domains
- **Netlify**: `*.netlify.app` domains
- **Heroku**: `*.herokuapp.com` domains
- **Custom domains**: `bealigned.com` and subdomains

### Detection Logic
```typescript
const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    // Development
    if (window.location.hostname === 'localhost') {
      return `http://localhost:8081`
    }

    // Production auto-detection
    const hostname = window.location.hostname
    const protocol = window.location.protocol

    // Recognized platforms
    if (hostname.includes('vercel.app') ||
        hostname.includes('netlify.app') ||
        hostname.includes('herokuapp.com') ||
        hostname.includes('bealigned.com')) {
      return `${protocol}//${hostname}`
    }

    // Environment variable override (optional)
    if (process.env.EXPO_PUBLIC_BASE_URL) {
      return process.env.EXPO_PUBLIC_BASE_URL
    }

    // Fallback to current domain
    return `${protocol}//${hostname}`
  }

  // Mobile/native apps
  return process.env.EXPO_PUBLIC_BASE_URL || 'https://bealigned.com'
}
```

## Usage Scenarios

### 1. Standard Deployment (GitHub → Vercel)
**No configuration needed** - the system automatically detects Vercel domains and uses the current deployment URL.

### 2. Custom Domain
**No configuration needed** - if your domain includes `bealigned.com`, it's automatically detected.

### 3. Alternative Domain (Temporary)
**Option A: Environment Variable**
Set `EXPO_PUBLIC_BASE_URL` in Vercel dashboard:
```
EXPO_PUBLIC_BASE_URL=https://your-alternative-domain.com
```

**Option B: Code Override (for testing)**
Temporarily modify the detection logic to include your domain:
```typescript
if (hostname.includes('your-temp-domain.com')) {
  return `${protocol}//${hostname}`
}
```

### 4. Staging Environment
**Environment Variable**
```
EXPO_PUBLIC_BASE_URL=https://staging.bealigned.com
```

## Testing

### Debug Output
When testing Facebook sharing, check the browser console for:

```
🔧 Runtime Detection Debug:
  - Platform.OS: web
  - window.location.hostname: localhost
  - window.location.protocol: http:
  - Environment EXPO_PUBLIC_BASE_URL: undefined
  - Detected Base URL: http://localhost:8081
🖼️ Final Image URL: http://localhost:8081/images/be_grounding_wk1.png
```

### Image Requirements
Ensure images are accessible at:
- **Development**: `http://localhost:8081/images/be_grounding_wk{1-12}.png`
- **Production**: `{DETECTED_URL}/images/be_grounding_wk{1-12}.png`

## Benefits

✅ **Zero Configuration**: Works out of the box on GitHub/Vercel
✅ **Automatic Detection**: Recognizes common deployment platforms
✅ **Flexible Override**: Environment variable support when needed
✅ **Development Friendly**: Localhost always works for testing
✅ **Fallback Safe**: Always has a working URL

## Troubleshooting

### Issue: Wrong URL Detected
**Solution**: Set `EXPO_PUBLIC_BASE_URL` environment variable in your deployment platform.

### Issue: Images Not Loading
**Solution**: Ensure images are placed in the `public/images/` folder with correct naming: `be_grounding_wk{1-12}.png`

### Issue: Facebook Sharing Not Working
**Solution**: Check browser console for debug output and verify the final image URL is accessible.