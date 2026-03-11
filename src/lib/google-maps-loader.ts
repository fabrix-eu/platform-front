// Singleton loader for Google Maps API

let isLoading = false;
let isLoaded = false;
const loadCallbacks: Array<() => void> = [];

export function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isLoaded && window.google) {
      resolve();
      return;
    }

    if (isLoading) {
      loadCallbacks.push(() => resolve());
      return;
    }

    isLoading = true;

    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api"]'
    );

    if (existingScript) {
      existingScript.addEventListener('load', () => {
        isLoaded = true;
        isLoading = false;
        loadCallbacks.forEach((cb) => cb());
        loadCallbacks.length = 0;
        resolve();
      });
      existingScript.addEventListener('error', () => {
        isLoading = false;
        reject(new Error('Failed to load Google Maps script'));
      });
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isLoaded = true;
      isLoading = false;
      loadCallbacks.forEach((cb) => cb());
      loadCallbacks.length = 0;
      resolve();
    };

    script.onerror = () => {
      isLoading = false;
      reject(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);
  });
}

export function isGoogleMapsLoaded(): boolean {
  return isLoaded && typeof window !== 'undefined' && !!window.google?.maps;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global {
  interface Window {
    google: any;
  }
}
