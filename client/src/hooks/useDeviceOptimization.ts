/*
  Device Optimization Hook
  Provides responsive scaling and device-specific optimizations
  Supports: Mobile, Tablet, Desktop, Ultrawide, Smart TVs, Low-end devices
*/

import { useEffect, useState } from 'react';

export interface DeviceProfile {
  type: 'mobile' | 'tablet' | 'desktop' | 'ultrawide' | 'tv' | 'lowend';
  width: number;
  height: number;
  dpr: number;
  isTouch: boolean;
  isTV: boolean;
  orientation: 'portrait' | 'landscape';
  maxFPS: number;
  reduceMotion: boolean;
  lowPowerMode: boolean;
}

export function useDeviceOptimization(): DeviceProfile {
  const [profile, setProfile] = useState<DeviceProfile>(() => getDeviceProfile());

  useEffect(() => {
    const handleResize = () => {
      setProfile(getDeviceProfile());
    };

    const handleOrientationChange = () => {
      setProfile(getDeviceProfile());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return profile;
}

function getDeviceProfile(): DeviceProfile {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;
  const isTouch = () => {
    return (
      ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0) ||
      ((navigator as any).msMaxTouchPoints > 0)
    );
  };

  // Detect TV (usually 1920x1080 or larger with no touch)
  const isTV = width >= 1920 && height >= 1080 && !isTouch();

  // Detect low-end device (low DPR, small RAM)
  const lowPowerMode = (navigator as any).deviceMemory < 4 || dpr < 1;

  // Detect reduced motion preference
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Determine device type
  let type: DeviceProfile['type'] = 'desktop';
  if (width < 640) {
    type = 'mobile';
  } else if (width < 1024) {
    type = 'tablet';
  } else if (width >= 2560) {
    type = 'ultrawide';
  } else if (isTV) {
    type = 'tv';
  } else if (lowPowerMode) {
    type = 'lowend';
  }

  // Determine max FPS based on device
  let maxFPS = 60;
  if (type === 'lowend' || lowPowerMode) {
    maxFPS = 30;
  } else if (type === 'tv') {
    maxFPS = 24; // TV-optimized
  }

  const orientation = width > height ? 'landscape' : 'portrait';

  return {
    type,
    width,
    height,
    dpr,
    isTouch: isTouch(),
    isTV,
    orientation,
    maxFPS,
    reduceMotion,
    lowPowerMode,
  };
}

// Responsive breakpoints
export const BREAKPOINTS = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  '3xl': 1920,
  '4xl': 2560,
};

// Device-specific CSS class generator
export function getDeviceClass(profile: DeviceProfile): string {
  return `device-${profile.type} orientation-${profile.orientation} ${
    profile.isTouch ? 'touch-enabled' : 'no-touch'
  } ${profile.reduceMotion ? 'reduce-motion' : 'motion-enabled'} ${
    profile.lowPowerMode ? 'low-power' : 'normal-power'
  }`;
}

// Responsive font size calculator
export function getResponsiveFontSize(baseSize: number, profile: DeviceProfile): number {
  const scaleFactors: Record<DeviceProfile['type'], number> = {
    mobile: 0.85,
    tablet: 0.95,
    desktop: 1,
    ultrawide: 1.15,
    tv: 1.3,
    lowend: 0.8,
  };

  return Math.round(baseSize * scaleFactors[profile.type]);
}

// Responsive spacing calculator
export function getResponsiveSpacing(baseSpacing: number, profile: DeviceProfile): number {
  const scaleFactors: Record<DeviceProfile['type'], number> = {
    mobile: 0.75,
    tablet: 0.9,
    desktop: 1,
    ultrawide: 1.2,
    tv: 1.5,
    lowend: 0.7,
  };

  return Math.round(baseSpacing * scaleFactors[profile.type]);
}

// Grid columns calculator
export function getGridColumns(profile: DeviceProfile): number {
  switch (profile.type) {
    case 'mobile':
      return profile.orientation === 'landscape' ? 3 : 2;
    case 'tablet':
      return profile.orientation === 'landscape' ? 4 : 3;
    case 'desktop':
      return 5;
    case 'ultrawide':
      return 7;
    case 'tv':
      return 8;
    case 'lowend':
      return 2;
    default:
      return 5;
  }
}

// Animation frame rate limiter
export function createFrameRateLimiter(maxFPS: number) {
  let lastTime = 0;
  const frameTime = 1000 / maxFPS;

  return (callback: FrameRequestCallback) => {
    const now = performance.now();
    const elapsed = now - lastTime;

    if (elapsed >= frameTime) {
      lastTime = now - (elapsed % frameTime);
      requestAnimationFrame(callback);
    } else {
      setTimeout(() => requestAnimationFrame(callback), frameTime - elapsed);
    }
  };
}
