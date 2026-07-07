import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, AppContext } from './AppContext';
import NavBar from './components/NavBar';
import InstallPrompt from './components/InstallPrompt';
// Screens
import HomeScreen from './screens/HomeScreen';
import SummaryScreen from './screens/SummaryScreen';
import LevelUpScreen from './screens/LevelUpScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import DisclaimerScreen from './screens/DisclaimerScreen';
import ProgressScreen from './screens/ProgressScreen';
import RanksScreen from './screens/RanksScreen';
import SettingsScreen from './screens/SettingsScreen';
import CameraScreen from './screens/CameraScreen';
import LegalScreen from './screens/LegalScreen';
import EquipmentScreen from './screens/EquipmentScreen';
import ProgramBuilderScreen from './screens/ProgramBuilderScreen';
import ManualLogScreen from './screens/ManualLogScreen';
import ExerciseHowToScreen from './screens/ExerciseHowToScreen';

function AppShell() {
  const { state, dispatch } = useContext(AppContext);

  // Flow: Onboarding -> Disclaimer -> Main app
  if (!state.onboardingComplete) {
    return <OnboardingScreen />;
  }
  if (!state.disclaimerAccepted) {
    return <DisclaimerScreen />;
  }
  // How-to screen (shown before camera)
  if (state.showHowTo) {
    return (
      <ExerciseHowToScreen
        exercise={state.currentExercise}
        onReady={() => dispatch({ type: 'DISMISS_HOW_TO' })}
      />
    );
  }
  // Camera overlay (one set per camera run) — or manual logging when bypassed
  if (state.showCamera) {
    const bypass = !state.settings?.formCheckEnabled || state.manualLogOverride;
    if (bypass) {
      return (
        <ManualLogScreen
          exercise={state.currentExercise}
          onComplete={(result) => dispatch({ type: 'COMPLETE_EXERCISE', payload: result })}
        />
      );
    }
    return (
      <CameraScreen
        exercise={state.currentExercise}
        onComplete={(result) => dispatch({ type: 'COMPLETE_EXERCISE', payload: result })}
        onSwitchExercise={(name) => dispatch({ type: 'SWITCH_EXERCISE', payload: name })}
      />
    );
  }
  // Level up overlay
  if (state.showLevelUp) {
    return <LevelUpScreen />;
  }
  // Equipment setup (from settings)
  if (state.showEquipmentSetup) {
    return <EquipmentScreen />;
  }
  // Program builder (design your own program)
  if (state.showProgramBuilder) {
    return <ProgramBuilderScreen />;
  }
  // Legal screens overlay
  if (state.showLegal) {
    return <LegalScreen type={state.showLegal} onClose={() => dispatch({ type: 'DISMISS_LEGAL' })} />;
  }

  return (
    <div className="app-shell">
      <div className="screen-container">
        <Routes>
          <Route path="/" element={state.showSummary ? <SummaryScreen /> : <HomeScreen />} />
          <Route path="/progress" element={<ProgressScreen />} />
          <Route path="/ranks" element={<RanksScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
        </Routes>
      </div>
      <NavBar />
      <InstallPrompt />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </BrowserRouter>
  );
}
