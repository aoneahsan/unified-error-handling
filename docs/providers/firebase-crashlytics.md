# Firebase Crashlytics Provider

The Firebase Crashlytics provider integrates with Google's Firebase Crashlytics service for crash reporting and analytics.

## Configuration

```typescript
await UnifiedErrorHandling.initialize({
  providers: [{
    type: 'firebase',
    config: {
      // All options are optional with defaults
      crashlyticsCollectionEnabled: true,
      enableInDevelopment: false,
      maximumQueueSize: 64,
      sessionTrackingEnabled: true,
      enableNdkCrashReporting: true, // Android only
      enableUnsentReportsCheck: true,
      autoInitialize: true,
      customKeys: {
        environment: 'production',
        version: '1.0.0'
      }
    }
  }]
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `crashlyticsCollectionEnabled` | boolean | true | Enable/disable crash collection |
| `enableInDevelopment` | boolean | false | Enable in development builds |
| `maximumQueueSize` | number | 64 | Maximum number of queued errors |
| `sessionTrackingEnabled` | boolean | true | Track user sessions |
| `enableNdkCrashReporting` | boolean | true | Enable NDK crash reporting (Android) |
| `enableUnsentReportsCheck` | boolean | true | Check for unsent reports on startup |
| `autoInitialize` | boolean | true | Auto-initialize on app start |
| `customKeys` | object | {} | Custom keys to attach to all reports |

## Features

### Automatic Crash Reporting

Firebase Crashlytics automatically captures:
- Native crashes (iOS/Android)
- JavaScript errors and exceptions
- React component errors (when using Error Boundaries)
- Promise rejections

### Custom Keys

Set custom keys that persist across app sessions:

```typescript
// During initialization
config: {
  customKeys: {
    user_type: 'premium',
    feature_flags: 'new_ui,dark_mode'
  }
}

// Or dynamically
await UnifiedErrorHandling.setTag('experiment', 'variant_a');
```

### User Identification

```typescript
await UnifiedErrorHandling.setUserContext({
  id: 'user123',
  email: 'user@example.com',
  username: 'johndoe'
});
```

### Breadcrumbs

Firebase Crashlytics supports custom breadcrumbs:

```typescript
await UnifiedErrorHandling.addBreadcrumb({
  message: 'User tapped checkout button',
  category: 'user_action',
  level: 'info',
  data: {
    cart_value: 99.99,
    items_count: 3
  }
});
```

### Non-Fatal Errors

Log non-fatal errors that don't crash the app:

```typescript
try {
  await riskyOperation();
} catch (error) {
  await UnifiedErrorHandling.logError(error, {
    level: 'error',
    handled: true,
    context: {
      operation: 'checkout',
      retry_count: 3
    }
  });
}
```

## Platform-Specific Setup

### iOS

1. Add Firebase to your iOS project:
   ```bash
   cd ios && pod install
   ```

2. Add your `GoogleService-Info.plist` to the iOS project

3. The plugin automatically configures Firebase if using `capacitor-firebase-kit`

### Android

1. Add your `google-services.json` to `android/app/`

2. The plugin automatically configures Firebase if using `capacitor-firebase-kit`

### Web

Firebase Crashlytics is not available for web platforms. The provider will gracefully degrade and log to console in development.

## Advanced Usage

### Custom Error Logging

```typescript
// Log with custom severity
await UnifiedErrorHandling.logError(error, {
  level: 'fatal', // Will be marked as fatal in Crashlytics
  fingerprint: ['checkout', 'payment', error.code]
});
```

### Force a Test Crash

```typescript
// Only works in development builds
if (__DEV__) {
  await UnifiedErrorHandling.testCrash();
}
```

### Check for Unsent Reports

```typescript
const hasUnsent = await UnifiedErrorHandling.checkForUnsentReports();
if (hasUnsent) {
  // Optionally prompt user before sending
  await UnifiedErrorHandling.sendUnsentReports();
}
```

## Best Practices

1. **User Privacy**: Always get user consent before enabling crash collection
2. **Custom Keys**: Use meaningful custom keys for better debugging
3. **Breadcrumbs**: Add breadcrumbs at key user interactions
4. **User Context**: Set user information early in the app lifecycle
5. **Error Grouping**: Use fingerprints to group similar errors

## Limitations

- Maximum 64 custom keys per report
- Maximum 64 log entries per report
- User ID limited to 1024 characters
- Custom key values limited to 1024 characters
- Not available on web platforms

## Migration from Native SDK

If migrating from the native Firebase Crashlytics SDK:

```typescript
// Before (Native SDK)
FirebaseCrashlytics.getInstance().recordException(exception);
FirebaseCrashlytics.getInstance().setUserId("user123");
FirebaseCrashlytics.getInstance().setCustomKey("key", "value");

// After (Unified Error Handling)
await UnifiedErrorHandling.logError(exception);
await UnifiedErrorHandling.setUserContext({ id: "user123" });
await UnifiedErrorHandling.setTag("key", "value");
```

## Troubleshooting

### Crashes Not Appearing

1. Ensure Firebase is properly configured
2. Check that crash collection is enabled
3. Crashes appear after app restart
4. Verify internet connectivity

### Development Testing

```typescript
// Enable in development for testing
config: {
  enableInDevelopment: true,
  crashlyticsCollectionEnabled: true
}
```