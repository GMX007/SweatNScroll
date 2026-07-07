import Foundation
import FamilyControls

/// Persists the user's Family Activity selection so the monitor extension can re-apply shields.
/// Requires iOS 16+ where `FamilyActivitySelection` is `Codable`.
enum ShieldSelectionStore {
    private static let key = "rep2scroll.familyActivitySelection"

    static func save(_ selection: FamilyActivitySelection) {
        guard let defaults = AppConstants.groupDefaults else { return }
        if let data = try? JSONEncoder().encode(selection) {
            defaults.set(data, forKey: key)
        }
    }

    static func load() -> FamilyActivitySelection? {
        guard let defaults = AppConstants.groupDefaults,
              let data = defaults.data(forKey: key),
              let decoded = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data) else {
            return nil
        }
        return decoded
    }

    static func clear() {
        AppConstants.groupDefaults?.removeObject(forKey: key)
    }
}
