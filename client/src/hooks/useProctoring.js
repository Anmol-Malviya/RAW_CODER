import { useState, useEffect, useCallback } from 'react';

export function useProctoring() {
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [lastWarningMsg, setLastWarningMsg] = useState('');
  const [isActive, setIsActive] = useState(false);

  const handleTabViolation = useCallback(() => {
    if (isActive) {
      setTabSwitchCount((prev) => prev + 1);
      setLastWarningMsg('⚠️ TAB SWITCH DETECTED: Please stay on the assessment page to avoid disqualification.');
      setShowWarning(true);
      // Auto-dismiss warning after 5 seconds
      setTimeout(() => setShowWarning(false), 5000);
    }
  }, [isActive]);

  const preventCopy = useCallback((e) => {
    if (isActive) {
      e.preventDefault();
      return false;
    }
  }, [isActive]);

  const preventContextMenu = useCallback((e) => {
    if (isActive) {
      e.preventDefault();
      return false;
    }
  }, [isActive]);

  // Activate proctoring
  const activate = useCallback(() => {
    setIsActive(true);
  }, []);

  // Deactivate proctoring
  const deactivate = useCallback(() => {
    setIsActive(false);
  }, []);

  useEffect(() => {
    if (isActive) {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          handleTabViolation();
        }
      };

      window.addEventListener('blur', handleTabViolation);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      document.addEventListener('copy', preventCopy);
      document.addEventListener('paste', preventCopy);
      document.addEventListener('contextmenu', preventContextMenu);

      return () => {
        window.removeEventListener('blur', handleTabViolation);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        document.removeEventListener('copy', preventCopy);
        document.removeEventListener('paste', preventCopy);
        document.removeEventListener('contextmenu', preventContextMenu);
      };
    }
  }, [isActive, handleTabViolation, preventCopy, preventContextMenu]);

  return {
    tabSwitchCount,
    showWarning,
    lastWarningMsg,
    isActive,
    activate,
    deactivate,
    dismissWarning: () => setShowWarning(false),
  };
}
