import Foundation
import Capacitor

/**
 * UnifiedErrorHandlingPlugin
 * 
 * Capacitor plugin for unified error handling across multiple providers
 */
@objc(UnifiedErrorHandlingPlugin)
public class UnifiedErrorHandlingPlugin: CAPPlugin {
    
    private var errorProviders: [String: Any] = [:]
    private var currentProvider: String?
    private var isInitialized = false
    private var config: [String: Any] = [:]
    
    // MARK: - Plugin Lifecycle
    
    public override func load() {
        super.load()
        setupGlobalErrorHandling()
    }
    
    // MARK: - Error Handling Methods
    
    @objc func initialize(_ call: CAPPluginCall) {
        guard let config = call.getObject("config") else {
            call.reject("Configuration is required")
            return
        }
        
        self.config = config
        
        // Get provider configuration
        guard let providerConfig = config["provider"] as? [String: Any],
              let providerType = providerConfig["provider"] as? String else {
            call.reject("Provider configuration is required")
            return
        }
        
        Task {
            do {
                try await initializeProvider(providerType, config: providerConfig)
                self.currentProvider = providerType
                self.isInitialized = true
                call.resolve(["success": true])
            } catch {
                call.reject("Failed to initialize provider: \(error.localizedDescription)")
            }
        }
    }
    
    @objc func logError(_ call: CAPPluginCall) {
        guard isInitialized else {
            call.reject("Plugin not initialized")
            return
        }
        
        let errorMessage = call.getString("error") ?? "Unknown error"
        let context = call.getObject("context") ?? [:]
        let level = call.getString("level") ?? "error"
        
        Task {
            do {
                try await sendErrorToProvider(
                    message: errorMessage,
                    context: context,
                    level: level
                )
                call.resolve(["success": true])
            } catch {
                call.reject("Failed to log error: \(error.localizedDescription)")
            }
        }
    }
    
    @objc func logMessage(_ call: CAPPluginCall) {
        guard isInitialized else {
            call.reject("Plugin not initialized")
            return
        }
        
        let message = call.getString("message") ?? ""
        let level = call.getString("level") ?? "info"
        let context = call.getObject("context") ?? [:]
        
        Task {
            do {
                try await sendMessageToProvider(
                    message: message,
                    level: level,
                    context: context
                )
                call.resolve(["success": true])
            } catch {
                call.reject("Failed to log message: \(error.localizedDescription)")
            }
        }
    }
    
    @objc func setUser(_ call: CAPPluginCall) {
        guard isInitialized else {
            call.reject("Plugin not initialized")
            return
        }
        
        let user = call.getObject("user")
        
        Task {
            do {
                try await setUserContext(user)
                call.resolve(["success": true])
            } catch {
                call.reject("Failed to set user: \(error.localizedDescription)")
            }
        }
    }
    
    @objc func setContext(_ call: CAPPluginCall) {
        guard isInitialized else {
            call.reject("Plugin not initialized")
            return
        }
        
        let key = call.getString("key") ?? ""
        let value = call.getValue("value")
        
        Task {
            do {
                try await setCustomContext(key: key, value: value)
                call.resolve(["success": true])
            } catch {
                call.reject("Failed to set context: \(error.localizedDescription)")
            }
        }
    }
    
    @objc func addBreadcrumb(_ call: CAPPluginCall) {
        guard isInitialized else {
            call.reject("Plugin not initialized")
            return
        }
        
        guard let breadcrumb = call.getObject("breadcrumb") else {
            call.reject("Breadcrumb data is required")
            return
        }
        
        Task {
            do {
                try await addBreadcrumbToProvider(breadcrumb)
                call.resolve(["success": true])
            } catch {
                call.reject("Failed to add breadcrumb: \(error.localizedDescription)")
            }
        }
    }
    
    @objc func setTags(_ call: CAPPluginCall) {
        guard isInitialized else {
            call.reject("Plugin not initialized")
            return
        }
        
        let tags = call.getObject("tags") ?? [:]
        
        Task {
            do {
                try await setTagsOnProvider(tags)
                call.resolve(["success": true])
            } catch {
                call.reject("Failed to set tags: \(error.localizedDescription)")
            }
        }
    }
    
    @objc func setTag(_ call: CAPPluginCall) {
        guard isInitialized else {
            call.reject("Plugin not initialized")
            return
        }
        
        let key = call.getString("key") ?? ""
        let value = call.getString("value") ?? ""
        
        Task {
            do {
                try await setTagOnProvider(key: key, value: value)
                call.resolve(["success": true])
            } catch {
                call.reject("Failed to set tag: \(error.localizedDescription)")
            }
        }
    }
    
    @objc func setExtra(_ call: CAPPluginCall) {
        guard isInitialized else {
            call.reject("Plugin not initialized")
            return
        }
        
        let key = call.getString("key") ?? ""
        let value = call.getValue("value")
        
        Task {
            do {
                try await setExtraOnProvider(key: key, value: value)
                call.resolve(["success": true])
            } catch {
                call.reject("Failed to set extra: \(error.localizedDescription)")
            }
        }
    }
    
    @objc func clearBreadcrumbs(_ call: CAPPluginCall) {
        guard isInitialized else {
            call.reject("Plugin not initialized")
            return
        }
        
        Task {
            do {
                try await clearBreadcrumbsFromProvider()
                call.resolve(["success": true])
            } catch {
                call.reject("Failed to clear breadcrumbs: \(error.localizedDescription)")
            }
        }
    }
    
    @objc func clearUser(_ call: CAPPluginCall) {
        guard isInitialized else {
            call.reject("Plugin not initialized")
            return
        }
        
        Task {
            do {
                try await clearUserFromProvider()
                call.resolve(["success": true])
            } catch {
                call.reject("Failed to clear user: \(error.localizedDescription)")
            }
        }
    }
    
    @objc func switchProvider(_ call: CAPPluginCall) {
        guard let providerType = call.getString("provider") else {
            call.reject("Provider type is required")
            return
        }
        
        let providerConfig = call.getObject("config") ?? [:]
        
        Task {
            do {
                try await switchToProvider(providerType, config: providerConfig)
                self.currentProvider = providerType
                call.resolve(["success": true])
            } catch {
                call.reject("Failed to switch provider: \(error.localizedDescription)")
            }
        }
    }
    
    @objc func flush(_ call: CAPPluginCall) {
        guard isInitialized else {
            call.reject("Plugin not initialized")
            return
        }
        
        let timeout = call.getInt("timeout") ?? 5000
        
        Task {
            do {
                let success = try await flushProvider(timeout: timeout)
                call.resolve(["success": success])
            } catch {
                call.reject("Failed to flush: \(error.localizedDescription)")
            }
        }
    }
    
    @objc func testError(_ call: CAPPluginCall) {
        guard isInitialized else {
            call.reject("Plugin not initialized")
            return
        }
        
        Task {
            do {
                try await sendTestError()
                call.resolve(["success": true])
            } catch {
                call.reject("Failed to send test error: \(error.localizedDescription)")
            }
        }
    }
    
    @objc func setEnabled(_ call: CAPPluginCall) {
        guard isInitialized else {
            call.reject("Plugin not initialized")
            return
        }
        
        let enabled = call.getBool("enabled") ?? true
        
        Task {
            do {
                try await setProviderEnabled(enabled)
                call.resolve(["success": true])
            } catch {
                call.reject("Failed to set enabled state: \(error.localizedDescription)")
            }
        }
    }
    
    // MARK: - Private Methods
    
    private func setupGlobalErrorHandling() {
        // Setup global exception handler
        NSSetUncaughtExceptionHandler { exception in
            Task {
                try? await self.handleUncaughtException(exception)
            }
        }
        
        // Setup signal handler for crashes
        let signals = [SIGABRT, SIGILL, SIGSEGV, SIGFPE, SIGBUS, SIGPIPE]
        for signal in signals {
            signal(signal) { signal in
                Task {
                    try? await self.handleSignal(signal)
                }
            }
        }
    }
    
    private func handleUncaughtException(_ exception: NSException) async throws {
        guard isInitialized else { return }
        
        let context = [
            "name": exception.name.rawValue,
            "reason": exception.reason ?? "Unknown reason",
            "userInfo": exception.userInfo ?? [:],
            "callStackSymbols": exception.callStackSymbols,
            "type": "uncaught_exception"
        ] as [String: Any]
        
        try await sendErrorToProvider(
            message: "Uncaught Exception: \(exception.name.rawValue)",
            context: context,
            level: "critical"
        )
    }
    
    private func handleSignal(_ signal: Int32) async throws {
        guard isInitialized else { return }
        
        let signalName = String(cString: strsignal(signal))
        let context = [
            "signal": signal,
            "signalName": signalName,
            "type": "signal"
        ] as [String: Any]
        
        try await sendErrorToProvider(
            message: "Signal received: \(signalName)",
            context: context,
            level: "critical"
        )
    }
    
    private func initializeProvider(_ providerType: String, config: [String: Any]) async throws {
        switch providerType {
        case "firebase":
            try await initializeFirebaseProvider(config)
        case "sentry":
            try await initializeSentryProvider(config)
        case "bugsnag":
            try await initializeBugsnagProvider(config)
        case "appcenter":
            try await initializeAppCenterProvider(config)
        default:
            throw ProviderError.unsupportedProvider(providerType)
        }
    }
    
    private func initializeFirebaseProvider(_ config: [String: Any]) async throws {
        // Import Firebase Crashlytics
        guard let FirebaseCrashlytics = NSClassFromString("FIRCrashlytics") else {
            throw ProviderError.providerNotAvailable("Firebase Crashlytics")
        }
        
        // Initialize Firebase if not already initialized
        if let FirebaseApp = NSClassFromString("FIRApp") {
            let configureSelector = NSSelectorFromString("configure")
            if FirebaseApp.responds(to: configureSelector) {
                FirebaseApp.perform(configureSelector)
            }
        }
        
        // Store provider reference
        errorProviders["firebase"] = FirebaseCrashlytics
    }
    
    private func initializeSentryProvider(_ config: [String: Any]) async throws {
        // Sentry iOS SDK initialization would go here
        // This is a placeholder for the actual implementation
        throw ProviderError.notImplemented("Sentry iOS integration")
    }
    
    private func initializeBugsnagProvider(_ config: [String: Any]) async throws {
        // Bugsnag iOS SDK initialization would go here
        // This is a placeholder for the actual implementation
        throw ProviderError.notImplemented("Bugsnag iOS integration")
    }
    
    private func initializeAppCenterProvider(_ config: [String: Any]) async throws {
        // AppCenter iOS SDK initialization would go here
        // This is a placeholder for the actual implementation
        throw ProviderError.notImplemented("AppCenter iOS integration")
    }
    
    private func sendErrorToProvider(message: String, context: [String: Any], level: String) async throws {
        guard let provider = currentProvider else {
            throw ProviderError.noActiveProvider
        }
        
        switch provider {
        case "firebase":
            try await sendErrorToFirebase(message: message, context: context, level: level)
        default:
            throw ProviderError.unsupportedProvider(provider)
        }
    }
    
    private func sendErrorToFirebase(message: String, context: [String: Any], level: String) async throws {
        guard let crashlytics = errorProviders["firebase"] else {
            throw ProviderError.providerNotInitialized("Firebase")
        }
        
        // Create NSError
        let error = NSError(domain: "UnifiedErrorHandling", code: 0, userInfo: [
            NSLocalizedDescriptionKey: message,
            "context": context,
            "level": level
        ])
        
        // Record error using Firebase Crashlytics
        let recordErrorSelector = NSSelectorFromString("recordError:")
        if let crashlyticsObj = crashlytics as? NSObject,
           crashlyticsObj.responds(to: recordErrorSelector) {
            crashlyticsObj.perform(recordErrorSelector, with: error)
        }
    }
    
    private func sendMessageToProvider(message: String, level: String, context: [String: Any]) async throws {
        guard let provider = currentProvider else {
            throw ProviderError.noActiveProvider
        }
        
        switch provider {
        case "firebase":
            try await sendMessageToFirebase(message: message, level: level, context: context)
        default:
            throw ProviderError.unsupportedProvider(provider)
        }
    }
    
    private func sendMessageToFirebase(message: String, level: String, context: [String: Any]) async throws {
        guard let crashlytics = errorProviders["firebase"] else {
            throw ProviderError.providerNotInitialized("Firebase")
        }
        
        // Log message using Firebase Crashlytics
        let logSelector = NSSelectorFromString("log:")
        if let crashlyticsObj = crashlytics as? NSObject,
           crashlyticsObj.responds(to: logSelector) {
            crashlyticsObj.perform(logSelector, with: "[\(level.uppercased())] \(message)")
        }
    }
    
    private func setUserContext(_ user: [String: Any]?) async throws {
        guard let provider = currentProvider else {
            throw ProviderError.noActiveProvider
        }
        
        switch provider {
        case "firebase":
            try await setUserContextOnFirebase(user)
        default:
            throw ProviderError.unsupportedProvider(provider)
        }
    }
    
    private func setUserContextOnFirebase(_ user: [String: Any]?) async throws {
        guard let crashlytics = errorProviders["firebase"] else {
            throw ProviderError.providerNotInitialized("Firebase")
        }
        
        if let user = user, let userId = user["id"] as? String {
            let setUserIdentifierSelector = NSSelectorFromString("setUserID:")
            if let crashlyticsObj = crashlytics as? NSObject,
               crashlyticsObj.responds(to: setUserIdentifierSelector) {
                crashlyticsObj.perform(setUserIdentifierSelector, with: userId)
            }
        }
    }
    
    private func setCustomContext(key: String, value: Any?) async throws {
        guard let provider = currentProvider else {
            throw ProviderError.noActiveProvider
        }
        
        switch provider {
        case "firebase":
            try await setCustomContextOnFirebase(key: key, value: value)
        default:
            throw ProviderError.unsupportedProvider(provider)
        }
    }
    
    private func setCustomContextOnFirebase(key: String, value: Any?) async throws {
        guard let crashlytics = errorProviders["firebase"] else {
            throw ProviderError.providerNotInitialized("Firebase")
        }
        
        let setCustomKeySelector = NSSelectorFromString("setCustomValue:forKey:")
        if let crashlyticsObj = crashlytics as? NSObject,
           crashlyticsObj.responds(to: setCustomKeySelector) {
            crashlyticsObj.perform(setCustomKeySelector, with: value, with: key)
        }
    }
    
    private func addBreadcrumbToProvider(_ breadcrumb: [String: Any]) async throws {
        guard let provider = currentProvider else {
            throw ProviderError.noActiveProvider
        }
        
        switch provider {
        case "firebase":
            try await addBreadcrumbToFirebase(breadcrumb)
        default:
            throw ProviderError.unsupportedProvider(provider)
        }
    }
    
    private func addBreadcrumbToFirebase(_ breadcrumb: [String: Any]) async throws {
        guard let crashlytics = errorProviders["firebase"] else {
            throw ProviderError.providerNotInitialized("Firebase")
        }
        
        let message = breadcrumb["message"] as? String ?? ""
        let logSelector = NSSelectorFromString("log:")
        if let crashlyticsObj = crashlytics as? NSObject,
           crashlyticsObj.responds(to: logSelector) {
            crashlyticsObj.perform(logSelector, with: "[BREADCRUMB] \(message)")
        }
    }
    
    private func setTagsOnProvider(_ tags: [String: Any]) async throws {
        // Tags are typically handled as custom keys in most providers
        for (key, value) in tags {
            try await setCustomContext(key: "tag_\(key)", value: value)
        }
    }
    
    private func setTagOnProvider(key: String, value: String) async throws {
        try await setCustomContext(key: "tag_\(key)", value: value)
    }
    
    private func setExtraOnProvider(key: String, value: Any?) async throws {
        try await setCustomContext(key: "extra_\(key)", value: value)
    }
    
    private func clearBreadcrumbsFromProvider() async throws {
        // Most providers don't support clearing breadcrumbs
        // This is a no-op for Firebase
    }
    
    private func clearUserFromProvider() async throws {
        try await setUserContext(nil)
    }
    
    private func switchToProvider(_ providerType: String, config: [String: Any]) async throws {
        try await initializeProvider(providerType, config: config)
    }
    
    private func flushProvider(timeout: Int) async throws -> Bool {
        // Most providers don't have explicit flush methods
        // This is a no-op for Firebase
        return true
    }
    
    private func sendTestError() async throws {
        let testError = NSError(domain: "UnifiedErrorHandling.Test", code: 999, userInfo: [
            NSLocalizedDescriptionKey: "This is a test error from iOS"
        ])
        
        try await sendErrorToProvider(
            message: "Test error from iOS",
            context: ["test": true, "platform": "iOS"],
            level: "error"
        )
    }
    
    private func setProviderEnabled(_ enabled: Bool) async throws {
        // Provider-specific enable/disable logic would go here
        // This is a placeholder
    }
}

// MARK: - Error Types

enum ProviderError: Error {
    case unsupportedProvider(String)
    case providerNotAvailable(String)
    case providerNotInitialized(String)
    case noActiveProvider
    case notImplemented(String)
    
    var localizedDescription: String {
        switch self {
        case .unsupportedProvider(let provider):
            return "Unsupported provider: \(provider)"
        case .providerNotAvailable(let provider):
            return "Provider not available: \(provider)"
        case .providerNotInitialized(let provider):
            return "Provider not initialized: \(provider)"
        case .noActiveProvider:
            return "No active provider"
        case .notImplemented(let feature):
            return "Feature not implemented: \(feature)"
        }
    }
}