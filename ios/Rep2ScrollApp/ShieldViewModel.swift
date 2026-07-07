import Combine
import DeviceActivity
import FamilyControls
import SwiftUI

@MainActor
final class ShieldViewModel: ObservableObject {
    @Published var selection = FamilyActivitySelection()
    @Published var authStatus: AuthorizationStatus = .notDetermined
    @Published var scheduleError: String?
    @Published var monitoringMessage: String?

    private let center = DeviceActivityCenter()

    init() {
        authStatus = AuthorizationCenter.shared.authorizationStatus
    }

    func refreshAuthStatus() {
        authStatus = AuthorizationCenter.shared.authorizationStatus
    }

    func requestAuthorization() async {
        do {
            try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
            refreshAuthStatus()
        } catch {
            refreshAuthStatus()
        }
    }

    /// Saves selection and applies shields immediately.
    func applyShieldsNow() {
        ShieldSelectionStore.save(selection)
        ShieldApplier.apply(selection)
        AppConstants.groupDefaults?.set(true, forKey: AppConstants.Keys.shieldsShouldBeOn)
    }

    func clearShields() {
        ShieldSelectionStore.clear()
        ShieldApplier.clear()
        AppConstants.groupDefaults?.set(false, forKey: AppConstants.Keys.shieldsShouldBeOn)
        stopExampleSchedule()
    }

    /// Example: re-apply shields every day during a window (adjust for your product).
    /// Real “earn scroll time” logic should start/stop monitoring based on your rules.
    func startExampleDailySchedule() {
        scheduleError = nil
        ShieldSelectionStore.save(selection)

        let schedule = DeviceActivitySchedule(
            intervalStart: DateComponents(hour: 9, minute: 0),
            intervalEnd: DateComponents(hour: 21, minute: 0),
            repeats: true
        )

        do {
            try center.startMonitoring(AppConstants.shieldScheduleName, during: schedule)
            monitoringMessage = "Monitoring schedule started (example: 9:00–21:00 daily)."
        } catch {
            scheduleError = error.localizedDescription
        }
    }

    func stopExampleSchedule() {
        center.stopMonitoring([AppConstants.shieldScheduleName])
        monitoringMessage = nil
    }
}
