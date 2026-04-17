import { useState, useEffect, useCallback, useRef } from 'react';

export function useProctoring() {
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const videoRef = useRef(null);

  const handleBlur = useCallback(() => {
    if (isActive) {
      setTabSwitchCount((prev) => prev + 1);
      setShowWarning(true);
    }
  }, [isActive]);

  const handleFocus = useCallback(() => {
    // Auto-dismiss warning after returning
    setTimeout(() => setShowWarning(false), 2000);
  }, []);

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
  const activate = useCallback(async () => {
    setIsActive(true);

    // Request camera
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setCameraStream(stream);
    } catch (err) {
      console.warn('Camera access denied:', err.message);
      setCameraError('Camera access denied. Proceeding without visual proctoring.');
    }
  }, []);

  // Deactivate proctoring
  const deactivate = useCallback(() => {
    setIsActive(false);
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  }, [cameraStream]);

  useEffect(() => {
    if (isActive) {
      window.addEventListener('blur', handleBlur);
      window.addEventListener('focus', handleFocus);
      document.addEventListener('copy', preventCopy);
      document.addEventListener('paste', preventCopy);
      document.addEventListener('contextmenu', preventContextMenu);
    }

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('paste', preventCopy);
      document.removeEventListener('contextmenu', preventContextMenu);
    };
  }, [isActive, handleBlur, handleFocus, preventCopy, preventContextMenu]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  return {
    tabSwitchCount,
    showWarning,
    cameraStream,
    cameraError,
    isActive,
    videoRef,
    activate,
    deactivate,
    dismissWarning: () => setShowWarning(false),
  };
}
