"use client";

import { useEffect, useRef } from "react";
import { toast } from "@/lib/toast-store";
import { loadGoogleMaps } from "@/utils/googleMapsLoader";

// Declare google on window to fix type errors
declare global {
    interface Window {
        google: any;
    }
}

// Key routes in Nashik to monitor
const ROUTES = [
    {
        name: "Dwarka Circle to CBS",
        origin: { lat: 19.9906, lng: 73.7915 },
        destination: { lat: 20.0055, lng: 73.7788 },
    },
    {
        name: "Nashik Road to Mumbai Naka",
        origin: { lat: 19.9535, lng: 73.8340 },
        destination: { lat: 19.9859, lng: 73.7845 },
    },
    {
        name: "Gangapur Road (Jehan to College Rd)",
        origin: { lat: 20.0247, lng: 73.7460 },
        destination: { lat: 20.0083, lng: 73.7570 },
    },
    {
        name: "Pathardi Phata to Indira Nagar",
        origin: { lat: 19.9602, lng: 73.7554 },
        destination: { lat: 19.9765, lng: 73.7716 }
    }
];

export function TrafficUpdater() {
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const serviceRef = useRef<any>(null); // Use any to avoid type issues
    const indexRef = useRef(0);

    useEffect(() => {
        // Function to check traffic
        const checkTraffic = async () => {
            if (typeof window === 'undefined') return;

            // Safety check: Ensure Google Maps is loaded
            if (!window.google || !window.google.maps) {
                return;
            }

            try {
                if (!serviceRef.current) {
                    // Double check constructor exists
                    if (window.google.maps.DirectionsService) {
                        serviceRef.current = new window.google.maps.DirectionsService();
                    } else {
                        return; // Not ready yet
                    }
                }

                const route = ROUTES[indexRef.current];
                // increment index for next time
                indexRef.current = (indexRef.current + 1) % ROUTES.length;

                // Fetch route data
                const result = await serviceRef.current.route({
                    origin: route.origin,
                    destination: route.destination,
                    travelMode: window.google.maps.TravelMode.DRIVING,
                    drivingOptions: {
                        departureTime: new Date(),
                        trafficModel: window.google.maps.TrafficModel.BEST_GUESS
                    }
                });

                if (result.routes && result.routes.length > 0) {
                    const leg = result.routes[0].legs[0];
                    const durationInTraffic = leg.duration_in_traffic?.value; // seconds
                    const durationNormal = leg.duration?.value; // seconds

                    if (durationInTraffic !== undefined && durationNormal !== undefined) {
                        const delaySeconds = durationInTraffic - durationNormal;
                        const delayMinutes = Math.floor(delaySeconds / 60);

                        if (delayMinutes >= 3) {
                            toast.error(`Heavy Traffic: ${route.name}. +${delayMinutes} min delay.`);
                        } else if (delayMinutes > 1) {
                            toast.normal(`Moderate Traffic: ${route.name}. +${delayMinutes} min delay.`);
                        } else {
                            toast.success(`Traffic Clear: ${route.name}. Moving smoothly.`);
                        }
                    } else {
                        toast.normal(`Traffic Update: ${route.name} - ${leg.duration?.text}`);
                    }
                }
            } catch (error) {
                // Squelch errors during active development/loading to prevent noise
            }
        };

        // Initialize: Load API then start polling
        const init = async () => {
            try {
                await loadGoogleMaps();
                // Start polling only after successful load
                startPolling();
            } catch (error) {
                console.error("TrafficUpdater: Failed to load Google Maps API", error);
            }
        };

        const startPolling = () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            checkTraffic(); // Check immediately
            intervalRef.current = setInterval(checkTraffic, 15000);
        };

        init();

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    return null;
}
