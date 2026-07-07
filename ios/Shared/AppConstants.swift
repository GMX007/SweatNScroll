import Foundation
import DeviceActivity

/// Shared between the main app and the Device Activity Monitor extension.
/// Replace with your real App Group from Xcode (Signing & Capabilities → App Groups).
enum AppConstants {
    static let appGroupId = "group.com.rep2scroll.shared"

    /// Schedule name used with `DeviceActivityCenter.startMonitoring(_:during:)`.
    static let shieldScheduleName = DeviceActivityName("rep2scroll.shieldWindow")

    /// UserDefaults keys (suite = app group).
    enum Keys {
        static let shieldsShouldBeOn = "rep2scroll.shieldsShouldBeOn"
    }

    static var groupDefaults: UserDefaults? {
        UserDefaults(suiteName: appGroupId)
    }
}
