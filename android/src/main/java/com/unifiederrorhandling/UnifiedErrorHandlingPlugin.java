package com.unifiederrorhandling;

import android.util.Log;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;
import com.getcapacitor.JSArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@CapacitorPlugin(name = "UnifiedErrorHandling")
public class UnifiedErrorHandlingPlugin extends Plugin {

    private static final String TAG = "UnifiedErrorHandling";
    
    private Map<String, Object> errorProviders = new HashMap<>();
    private String currentProvider;
    private boolean isInitialized = false;
    private JSObject config;
    
    @Override
    public void load() {
        super.load();
        setupGlobalErrorHandling();
    }

    @PluginMethod
    public void initialize(PluginCall call) {
        JSObject config = call.getObject("config");
        if (config == null) {
            call.reject("Configuration is required");
            return;
        }
        
        this.config = config;
        
        // Get provider configuration
        JSObject providerConfig = config.getJSObject("provider");
        if (providerConfig == null) {
            call.reject("Provider configuration is required");
            return;
        }
        
        String providerType = providerConfig.getString("provider");
        if (providerType == null) {
            call.reject("Provider type is required");
            return;
        }
        
        CompletableFuture.runAsync(() -> {
            try {
                initializeProvider(providerType, providerConfig);
                this.currentProvider = providerType;
                this.isInitialized = true;
                
                JSObject result = new JSObject();
                result.put("success", true);
                call.resolve(result);
            } catch (Exception e) {
                call.reject("Failed to initialize provider: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void logError(PluginCall call) {
        if (!isInitialized) {
            call.reject("Plugin not initialized");
            return;
        }
        
        String errorMessage = call.getString("error", "Unknown error");
        JSObject context = call.getObject("context", new JSObject());
        String level = call.getString("level", "error");
        
        CompletableFuture.runAsync(() -> {
            try {
                sendErrorToProvider(errorMessage, context, level);
                
                JSObject result = new JSObject();
                result.put("success", true);
                call.resolve(result);
            } catch (Exception e) {
                call.reject("Failed to log error: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void logMessage(PluginCall call) {
        if (!isInitialized) {
            call.reject("Plugin not initialized");
            return;
        }
        
        String message = call.getString("message", "");
        String level = call.getString("level", "info");
        JSObject context = call.getObject("context", new JSObject());
        
        CompletableFuture.runAsync(() -> {
            try {
                sendMessageToProvider(message, level, context);
                
                JSObject result = new JSObject();
                result.put("success", true);
                call.resolve(result);
            } catch (Exception e) {
                call.reject("Failed to log message: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void setUser(PluginCall call) {
        if (!isInitialized) {
            call.reject("Plugin not initialized");
            return;
        }
        
        JSObject user = call.getObject("user");
        
        CompletableFuture.runAsync(() -> {
            try {
                setUserContext(user);
                
                JSObject result = new JSObject();
                result.put("success", true);
                call.resolve(result);
            } catch (Exception e) {
                call.reject("Failed to set user: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void setContext(PluginCall call) {
        if (!isInitialized) {
            call.reject("Plugin not initialized");
            return;
        }
        
        String key = call.getString("key", "");
        Object value = call.getData().opt("value");
        
        CompletableFuture.runAsync(() -> {
            try {
                setCustomContext(key, value);
                
                JSObject result = new JSObject();
                result.put("success", true);
                call.resolve(result);
            } catch (Exception e) {
                call.reject("Failed to set context: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void addBreadcrumb(PluginCall call) {
        if (!isInitialized) {
            call.reject("Plugin not initialized");
            return;
        }
        
        JSObject breadcrumb = call.getObject("breadcrumb");
        if (breadcrumb == null) {
            call.reject("Breadcrumb data is required");
            return;
        }
        
        CompletableFuture.runAsync(() -> {
            try {
                addBreadcrumbToProvider(breadcrumb);
                
                JSObject result = new JSObject();
                result.put("success", true);
                call.resolve(result);
            } catch (Exception e) {
                call.reject("Failed to add breadcrumb: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void setTags(PluginCall call) {
        if (!isInitialized) {
            call.reject("Plugin not initialized");
            return;
        }
        
        JSObject tags = call.getObject("tags", new JSObject());
        
        CompletableFuture.runAsync(() -> {
            try {
                setTagsOnProvider(tags);
                
                JSObject result = new JSObject();
                result.put("success", true);
                call.resolve(result);
            } catch (Exception e) {
                call.reject("Failed to set tags: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void setTag(PluginCall call) {
        if (!isInitialized) {
            call.reject("Plugin not initialized");
            return;
        }
        
        String key = call.getString("key", "");
        String value = call.getString("value", "");
        
        CompletableFuture.runAsync(() -> {
            try {
                setTagOnProvider(key, value);
                
                JSObject result = new JSObject();
                result.put("success", true);
                call.resolve(result);
            } catch (Exception e) {
                call.reject("Failed to set tag: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void setExtra(PluginCall call) {
        if (!isInitialized) {
            call.reject("Plugin not initialized");
            return;
        }
        
        String key = call.getString("key", "");
        Object value = call.getData().opt("value");
        
        CompletableFuture.runAsync(() -> {
            try {
                setExtraOnProvider(key, value);
                
                JSObject result = new JSObject();
                result.put("success", true);
                call.resolve(result);
            } catch (Exception e) {
                call.reject("Failed to set extra: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void clearBreadcrumbs(PluginCall call) {
        if (!isInitialized) {
            call.reject("Plugin not initialized");
            return;
        }
        
        CompletableFuture.runAsync(() -> {
            try {
                clearBreadcrumbsFromProvider();
                
                JSObject result = new JSObject();
                result.put("success", true);
                call.resolve(result);
            } catch (Exception e) {
                call.reject("Failed to clear breadcrumbs: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void clearUser(PluginCall call) {
        if (!isInitialized) {
            call.reject("Plugin not initialized");
            return;
        }
        
        CompletableFuture.runAsync(() -> {
            try {
                clearUserFromProvider();
                
                JSObject result = new JSObject();
                result.put("success", true);
                call.resolve(result);
            } catch (Exception e) {
                call.reject("Failed to clear user: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void switchProvider(PluginCall call) {
        String providerType = call.getString("provider");
        if (providerType == null) {
            call.reject("Provider type is required");
            return;
        }
        
        JSObject providerConfig = call.getObject("config", new JSObject());
        
        CompletableFuture.runAsync(() -> {
            try {
                switchToProvider(providerType, providerConfig);
                this.currentProvider = providerType;
                
                JSObject result = new JSObject();
                result.put("success", true);
                call.resolve(result);
            } catch (Exception e) {
                call.reject("Failed to switch provider: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void flush(PluginCall call) {
        if (!isInitialized) {
            call.reject("Plugin not initialized");
            return;
        }
        
        int timeout = call.getInt("timeout", 5000);
        
        CompletableFuture.runAsync(() -> {
            try {
                boolean success = flushProvider(timeout);
                
                JSObject result = new JSObject();
                result.put("success", success);
                call.resolve(result);
            } catch (Exception e) {
                call.reject("Failed to flush: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void testError(PluginCall call) {
        if (!isInitialized) {
            call.reject("Plugin not initialized");
            return;
        }
        
        CompletableFuture.runAsync(() -> {
            try {
                sendTestError();
                
                JSObject result = new JSObject();
                result.put("success", true);
                call.resolve(result);
            } catch (Exception e) {
                call.reject("Failed to send test error: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void setEnabled(PluginCall call) {
        if (!isInitialized) {
            call.reject("Plugin not initialized");
            return;
        }
        
        boolean enabled = call.getBoolean("enabled", true);
        
        CompletableFuture.runAsync(() -> {
            try {
                setProviderEnabled(enabled);
                
                JSObject result = new JSObject();
                result.put("success", true);
                call.resolve(result);
            } catch (Exception e) {
                call.reject("Failed to set enabled state: " + e.getMessage());
            }
        });
    }

    // Private Methods

    private void setupGlobalErrorHandling() {
        // Set up uncaught exception handler
        Thread.setDefaultUncaughtExceptionHandler(new Thread.UncaughtExceptionHandler() {
            @Override
            public void uncaughtException(Thread thread, Throwable throwable) {
                if (isInitialized) {
                    try {
                        handleUncaughtException(throwable);
                    } catch (Exception e) {
                        Log.e(TAG, "Error handling uncaught exception", e);
                    }
                }
            }
        });
    }

    private void handleUncaughtException(Throwable throwable) throws Exception {
        JSObject context = new JSObject();
        context.put("thread", Thread.currentThread().getName());
        context.put("stackTrace", Log.getStackTraceString(throwable));
        context.put("type", "uncaught_exception");
        
        sendErrorToProvider(
            "Uncaught Exception: " + throwable.getMessage(),
            context,
            "critical"
        );
    }

    private void initializeProvider(String providerType, JSObject config) throws Exception {
        switch (providerType) {
            case "firebase":
                initializeFirebaseProvider(config);
                break;
            case "sentry":
                initializeSentryProvider(config);
                break;
            case "bugsnag":
                initializeBugsnagProvider(config);
                break;
            case "appcenter":
                initializeAppCenterProvider(config);
                break;
            default:
                throw new IllegalArgumentException("Unsupported provider: " + providerType);
        }
    }

    private void initializeFirebaseProvider(JSObject config) throws Exception {
        try {
            // Initialize Firebase Crashlytics
            Class<?> firebaseCrashlyticsClass = Class.forName("com.google.firebase.crashlytics.FirebaseCrashlytics");
            Object crashlytics = firebaseCrashlyticsClass.getMethod("getInstance").invoke(null);
            
            // Store provider reference
            errorProviders.put("firebase", crashlytics);
            
            Log.d(TAG, "Firebase Crashlytics initialized successfully");
        } catch (Exception e) {
            throw new Exception("Failed to initialize Firebase Crashlytics: " + e.getMessage());
        }
    }

    private void initializeSentryProvider(JSObject config) throws Exception {
        // Sentry Android SDK initialization would go here
        // This is a placeholder for the actual implementation
        throw new Exception("Sentry Android integration not implemented yet");
    }

    private void initializeBugsnagProvider(JSObject config) throws Exception {
        // Bugsnag Android SDK initialization would go here
        // This is a placeholder for the actual implementation
        throw new Exception("Bugsnag Android integration not implemented yet");
    }

    private void initializeAppCenterProvider(JSObject config) throws Exception {
        // AppCenter Android SDK initialization would go here
        // This is a placeholder for the actual implementation
        throw new Exception("AppCenter Android integration not implemented yet");
    }

    private void sendErrorToProvider(String message, JSObject context, String level) throws Exception {
        if (currentProvider == null) {
            throw new Exception("No active provider");
        }
        
        switch (currentProvider) {
            case "firebase":
                sendErrorToFirebase(message, context, level);
                break;
            default:
                throw new Exception("Unsupported provider: " + currentProvider);
        }
    }

    private void sendErrorToFirebase(String message, JSObject context, String level) throws Exception {
        Object crashlytics = errorProviders.get("firebase");
        if (crashlytics == null) {
            throw new Exception("Firebase provider not initialized");
        }
        
        try {
            // Create exception
            Exception exception = new Exception(message);
            
            // Record exception using Firebase Crashlytics
            Class<?> crashlyticsClass = crashlytics.getClass();
            crashlyticsClass.getMethod("recordException", Throwable.class).invoke(crashlytics, exception);
            
            // Log context data
            if (context != null) {
                for (String key : context.keys()) {
                    Object value = context.get(key);
                    crashlyticsClass.getMethod("setCustomKey", String.class, String.class)
                        .invoke(crashlytics, key, String.valueOf(value));
                }
            }
            
            Log.d(TAG, "Error sent to Firebase: " + message);
        } catch (Exception e) {
            throw new Exception("Failed to send error to Firebase: " + e.getMessage());
        }
    }

    private void sendMessageToProvider(String message, String level, JSObject context) throws Exception {
        if (currentProvider == null) {
            throw new Exception("No active provider");
        }
        
        switch (currentProvider) {
            case "firebase":
                sendMessageToFirebase(message, level, context);
                break;
            default:
                throw new Exception("Unsupported provider: " + currentProvider);
        }
    }

    private void sendMessageToFirebase(String message, String level, JSObject context) throws Exception {
        Object crashlytics = errorProviders.get("firebase");
        if (crashlytics == null) {
            throw new Exception("Firebase provider not initialized");
        }
        
        try {
            // Log message using Firebase Crashlytics
            Class<?> crashlyticsClass = crashlytics.getClass();
            crashlyticsClass.getMethod("log", String.class)
                .invoke(crashlytics, "[" + level.toUpperCase() + "] " + message);
            
            Log.d(TAG, "Message sent to Firebase: " + message);
        } catch (Exception e) {
            throw new Exception("Failed to send message to Firebase: " + e.getMessage());
        }
    }

    private void setUserContext(JSObject user) throws Exception {
        if (currentProvider == null) {
            throw new Exception("No active provider");
        }
        
        switch (currentProvider) {
            case "firebase":
                setUserContextOnFirebase(user);
                break;
            default:
                throw new Exception("Unsupported provider: " + currentProvider);
        }
    }

    private void setUserContextOnFirebase(JSObject user) throws Exception {
        Object crashlytics = errorProviders.get("firebase");
        if (crashlytics == null) {
            throw new Exception("Firebase provider not initialized");
        }
        
        try {
            if (user != null) {
                String userId = user.getString("id");
                if (userId != null) {
                    Class<?> crashlyticsClass = crashlytics.getClass();
                    crashlyticsClass.getMethod("setUserId", String.class)
                        .invoke(crashlytics, userId);
                }
            }
        } catch (Exception e) {
            throw new Exception("Failed to set user context on Firebase: " + e.getMessage());
        }
    }

    private void setCustomContext(String key, Object value) throws Exception {
        if (currentProvider == null) {
            throw new Exception("No active provider");
        }
        
        switch (currentProvider) {
            case "firebase":
                setCustomContextOnFirebase(key, value);
                break;
            default:
                throw new Exception("Unsupported provider: " + currentProvider);
        }
    }

    private void setCustomContextOnFirebase(String key, Object value) throws Exception {
        Object crashlytics = errorProviders.get("firebase");
        if (crashlytics == null) {
            throw new Exception("Firebase provider not initialized");
        }
        
        try {
            Class<?> crashlyticsClass = crashlytics.getClass();
            crashlyticsClass.getMethod("setCustomKey", String.class, String.class)
                .invoke(crashlytics, key, String.valueOf(value));
        } catch (Exception e) {
            throw new Exception("Failed to set custom context on Firebase: " + e.getMessage());
        }
    }

    private void addBreadcrumbToProvider(JSObject breadcrumb) throws Exception {
        if (currentProvider == null) {
            throw new Exception("No active provider");
        }
        
        switch (currentProvider) {
            case "firebase":
                addBreadcrumbToFirebase(breadcrumb);
                break;
            default:
                throw new Exception("Unsupported provider: " + currentProvider);
        }
    }

    private void addBreadcrumbToFirebase(JSObject breadcrumb) throws Exception {
        Object crashlytics = errorProviders.get("firebase");
        if (crashlytics == null) {
            throw new Exception("Firebase provider not initialized");
        }
        
        try {
            String message = breadcrumb.getString("message", "");
            
            Class<?> crashlyticsClass = crashlytics.getClass();
            crashlyticsClass.getMethod("log", String.class)
                .invoke(crashlytics, "[BREADCRUMB] " + message);
        } catch (Exception e) {
            throw new Exception("Failed to add breadcrumb to Firebase: " + e.getMessage());
        }
    }

    private void setTagsOnProvider(JSObject tags) throws Exception {
        // Tags are typically handled as custom keys in most providers
        if (tags != null) {
            for (String key : tags.keys()) {
                Object value = tags.get(key);
                setCustomContext("tag_" + key, value);
            }
        }
    }

    private void setTagOnProvider(String key, String value) throws Exception {
        setCustomContext("tag_" + key, value);
    }

    private void setExtraOnProvider(String key, Object value) throws Exception {
        setCustomContext("extra_" + key, value);
    }

    private void clearBreadcrumbsFromProvider() throws Exception {
        // Most providers don't support clearing breadcrumbs
        // This is a no-op for Firebase
    }

    private void clearUserFromProvider() throws Exception {
        setUserContext(null);
    }

    private void switchToProvider(String providerType, JSObject config) throws Exception {
        initializeProvider(providerType, config);
    }

    private boolean flushProvider(int timeout) throws Exception {
        // Most providers don't have explicit flush methods
        // This is a no-op for Firebase
        return true;
    }

    private void sendTestError() throws Exception {
        JSObject context = new JSObject();
        context.put("test", true);
        context.put("platform", "Android");
        
        sendErrorToProvider(
            "Test error from Android",
            context,
            "error"
        );
    }

    private void setProviderEnabled(boolean enabled) throws Exception {
        // Provider-specific enable/disable logic would go here
        // This is a placeholder
    }
}