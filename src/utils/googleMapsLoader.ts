"use client";

let loadingPromise: Promise<void> | null = null;

export const loadGoogleMaps = (): Promise<void> => {
    if (typeof window === "undefined") return Promise.resolve();

    // Already loaded
    if (window.google && window.google.maps) {
        return Promise.resolve();
    }

    // Already loading
    if (loadingPromise) {
        return loadingPromise;
    }

    loadingPromise = new Promise((resolve, reject) => {
        // Double check in case of race condition
        if (window.google && window.google.maps) {
            resolve();
            return;
        }

        // Check if script exists in DOM (inserted by another component or external)
        const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
        if (existingScript) {
            // Script exists, poll until window.google.maps is available
            const check = setInterval(() => {
                if (window.google && window.google.maps) {
                    clearInterval(check);
                    resolve();
                }
            }, 100);
            return;
        }

        // Create Script
        const script = document.createElement("script");
        // Using a unique callback name to avoid conflicts
        const callbackName = "initGoogleMaps_" + Math.random().toString(36).substr(2, 9);

        window[callbackName as unknown as string] = () => {
            resolve();
            // cleanup
            delete window[callbackName as unknown as string];
        };

        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDDs2zpvbxf7cpWK0-5uKpxNtbq91Y7v6A&libraries=visualization,geometry,places&loading=async&callback=${callbackName}`;
        script.async = true;
        script.defer = true;

        script.onerror = (err) => {
            reject(err);
            loadingPromise = null; // reset on error
        };

        document.head.appendChild(script);
    });

    return loadingPromise;
};
