import DeviceActivity
import FamilyControls
import ManagedSettings

/// Xcode target: Device Activity Monitor Extension
final class Rep2ScrollMonitorExtension: DeviceActivityMonitor {
    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)
        guard activity == AppConstants.shieldScheduleName else { return }

        let shouldShield = AppConstants.groupDefaults?.bool(forKey: AppConstants.Keys.shieldsShouldBeOn) ?? false
        guard shouldShield, let selection = ShieldSelectionStore.load() else {
            ShieldApplier.clear()
            return
        }
        ShieldApplier.apply(selection)
    }

    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)
        guard activity == AppConstants.shieldScheduleName else { return }

        /// Example policy: remove shields when the interval ends. For “earned scroll time”, you might
        /// instead keep shields off until a timer fires — implement your product rules here.
        let shouldShield = AppConstants.groupDefaults?.bool(forKey: AppConstants.Keys.shieldsShouldBeOn) ?? false
        if !shouldShield {
            ShieldApplier.clear()
        }
    }
}
