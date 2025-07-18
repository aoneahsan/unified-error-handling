// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "UnifiedErrorHandling",
    platforms: [.iOS(.v13)],
    products: [
        .library(
            name: "UnifiedErrorHandling",
            targets: ["UnifiedErrorHandlingPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", branch: "main")
    ],
    targets: [
        .target(
            name: "UnifiedErrorHandlingPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "Sources/UnifiedErrorHandlingPlugin"),
        .testTarget(
            name: "UnifiedErrorHandlingPluginTests",
            dependencies: ["UnifiedErrorHandlingPlugin"],
            path: "Tests/UnifiedErrorHandlingPluginTests")
    ]
)