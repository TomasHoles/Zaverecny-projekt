import React, { useState, useEffect } from 'react';
import { usePWA } from '../hooks/usePWA';
import Icon from './Icon';
import '../styles/InstallPrompt.css';

const InstallPrompt: React.FC = () => {
  const { isInstallable, isInstalled, promptInstall } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the prompt before
    const isDismissed = localStorage.getItem('pwa-install-dismissed');
    if (isDismissed) {
      setDismissed(true);
    }

    // Show prompt after 30 seconds if installable and not dismissed
    const timer = setTimeout(() => {
      if (isInstallable && !isDismissed && !isInstalled) {
        setShowPrompt(true);
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled]);

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt || !isInstallable || isInstalled || dismissed) {
    return null;
  }

  return (
    <div className="install-prompt">
      <div className="install-prompt-content">
        <button className="install-prompt-close" onClick={handleDismiss}>
          ×
        </button>
        
        <div className="install-prompt-icon">
          <Icon name="download" size={24} />
        </div>
        
        <div className="install-prompt-text">
          <h3>Nainstalovat Plutoa</h3>
          <p>Přidejte si Plutoa na plochu pro rychlý přístup a offline režim</p>
        </div>
        
        <div className="install-prompt-actions">
          <button className="install-prompt-btn primary" onClick={handleInstall}>
            Nainstalovat
          </button>
          <button className="install-prompt-btn secondary" onClick={handleDismiss}>
            Možná později
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
