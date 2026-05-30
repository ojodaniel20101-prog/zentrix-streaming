import { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Capture the prompt if available
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Always show banner on mobile after 3 seconds
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const dismissed = localStorage.getItem('pwa-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (isMobile && Date.now() - dismissedTime > sevenDays) {
      setTimeout(() => setShowBanner(true), 3000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      handleDismiss();
    }
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-dismissed', Date.now().toString());
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-3 right-3 z-50 animate-in slide-in-from-bottom duration-500">
      <div className="bg-[#0d1117] rounded-2xl shadow-xl border border-white/10 p-3 flex items-center gap-3">
        <img src="/icon-192.png" className="w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-bold text-white">Install Zentrix Tech</p>
          <p className="text-xs text-gray-400">Add to your home screen as an app</p>
        </div>
        <button onClick={handleInstall}
          className="bg-[#00D4FF] text-[#050816] font-bold text-sm px-4 py-2 rounded-full flex items-center gap-1 flex-shrink-0">
          ⬇ Install
        </button>
        <button onClick={handleDismiss} className="text-gray-400 text-lg flex-shrink-0">✕</button>
      </div>
    </div>
  );
}
