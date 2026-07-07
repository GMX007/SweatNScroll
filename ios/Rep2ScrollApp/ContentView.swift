import FamilyControls
import SwiftUI

struct ContentView: View {
    @StateObject private var model = ShieldViewModel()
    @State private var showPicker = false

    var body: some View {
        NavigationStack {
            List {
                Section("Screen Time") {
                    HStack {
                        Text("Authorization")
                        Spacer()
                        Text(String(describing: model.authStatus))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Button("Authorize Screen Time") {
                        Task { await model.requestAuthorization() }
                    }
                }

                Section("Blocking") {
                    Button("Choose apps & categories to block") {
                        showPicker = true
                    }
                    Button("Apply shields now") {
                        model.applyShieldsNow()
                    }
                    .disabled(model.selection.applicationTokens.isEmpty && model.selection.categoryTokens.isEmpty && model.selection.webDomainTokens.isEmpty)

                    Button("Clear all shields", role: .destructive) {
                        model.clearShields()
                    }
                }

                Section("Device Activity (example)") {
                    Text("Starts a repeating schedule so the extension can sync shield state. Replace with your “earn time” logic.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Button("Start example schedule") {
                        model.startExampleDailySchedule()
                    }
                    Button("Stop schedule") {
                        model.stopExampleSchedule()
                    }
                    if let err = model.scheduleError {
                        Text(err).font(.caption).foregroundStyle(.red)
                    }
                    if let msg = model.monitoringMessage {
                        Text(msg).font(.caption)
                    }
                }

                Section("Rep2Scroll web app") {
                    Text("Add a WKWebView screen in Xcode that loads your deployed URL. This file only handles native shields.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Rep2Scroll")
            .familyActivityPicker(isPresented: $showPicker, selection: $model.selection)
            .onAppear { model.refreshAuthStatus() }
        }
    }
}

#Preview {
    ContentView()
}
