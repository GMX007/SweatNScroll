import Foundation
import FamilyControls
import ManagedSettings

/// Applies or clears shields. Safe to call from the main app or the monitor extension (same process rules apply per target).
enum ShieldApplier {
    private static let store = ManagedSettingsStore()

    static func apply(_ selection: FamilyActivitySelection) {
        store.shield.applications = selection.applicationTokens.isEmpty ? nil : selection.applicationTokens
        store.shield.applicationCategories = selection.categoryTokens.isEmpty
            ? .none
            : .specific(selection.categoryTokens)
        store.shield.webDomains = selection.webDomainTokens.isEmpty ? nil : selection.webDomainTokens
    }

    static func clear() {
        store.clearAllSettings()
    }
}
