#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Define the plugin using the CAP_PLUGIN Macro, and
// each method the plugin supports using the CAP_PLUGIN_METHOD macro.
CAP_PLUGIN(UnifiedErrorHandlingPlugin, "UnifiedErrorHandling",
           CAP_PLUGIN_METHOD(initialize, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(logError, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(logMessage, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(setUser, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(setContext, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(addBreadcrumb, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(setTags, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(setTag, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(setExtra, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(clearBreadcrumbs, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(clearUser, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(switchProvider, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(flush, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(testError, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(setEnabled, CAPPluginReturnPromise);
)