import React, { useState, useEffect } from 'react';

/**
 * PWA Install Banner — shows right after onboarding.
 * Gives platform-specific instructions for adding to home screen.
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const dismissCount = parseInt(localStorage.getItem('formforged_install_dismiss') || '0', 10);
    if (dismissCount >= 2) { setDismissed(true); return; }
    if (window.matchMedia('(display-mode: standalone)').matches) { setDismissed(true); return; }

    const iosCheck = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iosCheck);

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (iosCheck && !navigator.standalone) {
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => { clearTimeout(timer); window.removeEventListener('beforeinstallprompt', handler); };
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') setShowBanner(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    const current = parseInt(localStorage.getItem('formforged_install_dismiss') || '0', 10);
    localStorage.setItem('formforged_install_dismiss', String(current + 1));
    setShowBanner(false);
    if (current + 1 >= 2) setDismissed(true);
  };

  if (!showBanner || dismissed) return null;

  return (
    <div style={styles.banner}>
      <div style={styles.topRow}>
        <img src="/icon-192.png" alt="FormForged icon" style={styles.appIcon} />
        <div style={styles.text}>
          <div style={styles.title}>Add FormForged to your phone!</div>
          <div style={styles.sub}>
            {isIOS
              ? "Tap the Share button (the square with an arrow) at the bottom of Safari, then tap \"Add to Home Screen\""
              : "Tap the \u22EE menu (3 dots) in the top right of your browser, then tap \"Add to Home Screen\" or \"Install App\""
            }
          </div>
        </div>
      </div>
      <div style={styles.actions}>
        {deferredPrompt && (
          <button onClick={handleInstall} style={styles.installBtn}>
            Install Now
          </button>
        )}
        <button onClick={handleDismiss} style={styles.laterBtn}>Got it!</button>
      </div>
    </div>
  );
}

const styles = {
  banner: {
    position: 'fixed',
    bottom: 80,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100% - 32px)',
    maxWidth: 400,
    background: 'linear-gradient(135deg, #E8533A, #D4432A)',
    borderRadius: 24,
    padding: '18px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    zIndex: 90,
    boxShadow: '0 12px 40px rgba(232,83,58,0.4)',
    animation: 'slide-up 0.3s ease',
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  appIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    flexShrink: 0,
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 800,
    color: 'white',
    marginBottom: 6,
  },
  sub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 1.5,
  },
  actions: {
    display: 'flex',
    gap: 8,
  },
  installBtn: {
    flex: 1,
    background: 'white',
    border: 'none',
    borderRadius: 16,
    padding: '12px 20px',
    color: '#E8533A',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  laterBtn: {
    flex: 1,
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: 16,
    padding: '12px 20px',
    color: 'white',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
};
