/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState, type JSX } from "react";
import { parseKMLFile } from "@/utils/kmlParser";
import { Toggle, GooeyFilter } from "./LiquidToggle";

type MarkerDefinition = {
	position: { lat: number; lng: number };
	title?: string;
	label?: string;
	icon?: string;
	meta?: Record<string, unknown>;
};

interface GoogleMapProps {
	center?: { lat: number; lng: number };
	zoom?: number;
	height?: string;
	width?: string;
	className?: string;
	markers?: MarkerDefinition[];
	markerGroups?: Array<{
		name: string;
		markers: MarkerDefinition[];
		color?: string;
		icon?: string;
		visible?: boolean;
	}>;
	heatmap?: {
		data: Array<{ position: { lat: number; lng: number }; weight?: number }>;
		visible?: boolean;
		radius?: number;
		opacity?: number;
		gradient?: string[];
		maxIntensity?: number;
		dissipating?: boolean;
	};
	kmlLayer?: {
		url?: string;
		visible?: boolean;
		preserveBounds?: boolean;
		suppressInfoWindows?: boolean;
	};
	geoJsonLayer?: {
		data?: object;
		url?: string;
		visible?: boolean;
		style?: {
			strokeColor?: string;
			strokeOpacity?: number;
			strokeWeight?: number;
			fillColor?: string;
			fillOpacity?: number;
		};
	};
	polylines?: Array<{
		festivalName: string;
		color: string;
		visible: boolean;
		routes: Array<{
			id: number;
			path: Array<{ lat: number; lng: number }>;
			startPoint: { lat: number; lng: number };
			endPoint: { lat: number; lng: number };
			festival_name: string;
			procession_number: string;
			start_address: string;
			end_address: string;
			total_distance: number;
			description: string;
		}>;
	}>;
	selectedPoint?: { lat: number; lng: number; zoom?: number };
	onPointClick?: (point: { lat: number; lng: number; title?: string; group?: string; meta?: Record<string, unknown> }) => void;
	/** Fired when a procession route (polyline or its endpoints) is clicked */
	onRouteClick?: (route: {
		id: number;
		festivalName: string;
		color: string;
		festival_name: string;
		procession_number: string;
		path: Array<{ lat: number; lng: number }>;
		startPoint: { lat: number; lng: number };
		endPoint: { lat: number; lng: number };
		start_address: string;
		end_address: string;
		total_distance: number;
		description: string;
		police_station?: string;
		village?: string;
		start_time?: string | null;
		end_time?: string | null;
		duration_minutes?: number | null;
		expected_crowd?: number | null;
	}) => void;
	searchablePoints?: Array<{
		id: string;
		position: { lat: number; lng: number };
		title: string;
		description?: string;
		tags?: string[];
		group?: string;
	}>;
	onKMLToggle?: (visible: boolean) => void;
	onGeoJSONToggle?: (visible: boolean) => void;
	onMarkersToggle?: (visible: boolean) => void;
	onHeatmapToggle?: (visible: boolean) => void;
	// onCCTVToggle is reserved for future use to avoid breaking API
	onCCTVToggle?: (visible: boolean) => void;
	onBoundsChanged?: (bounds: { north: number; south: number; east: number; west: number; zoom: number }) => void;
	/** Fired when hovering over a KML boundary polygon */
	onBoundaryHover?: (boundary: { name: string; lat: number; lng: number } | null) => void;
	showLayerControls?: boolean;
	directions?: any; // Google Maps DirectionsResult
}

declare global {
	interface Window {
		google: any;
		initMap: () => void;
	}
}

export default function GoogleMap({
	center = { lat: 37.7749, lng: -122.4194 },
	zoom = 10,
	height = "400px",
	width = "100%",
	className = "",
	markers = [],
	markerGroups = [],
	heatmap,
	kmlLayer,
	geoJsonLayer,
	polylines = [],
	selectedPoint,
	onPointClick,
	onRouteClick,
	onKMLToggle,
	onGeoJSONToggle,
	onMarkersToggle,
	onHeatmapToggle,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onCCTVToggle,
	onBoundsChanged,
	onBoundaryHover,
	showLayerControls = false,
	directions,
}: GoogleMapProps): JSX.Element {
	const mapRef = useRef<HTMLDivElement>(null);
	const [isLoaded, setIsLoaded] = useState(false);
	const mapInstanceRef = useRef<any>(null);
	const markersRef = useRef<any[]>([]);
	const groupMarkersRef = useRef<Map<string, any[]>>(new Map());
	const heatmapRef = useRef<any>(null);
	const kmlLayerRef = useRef<any>(null);
	const geoJsonLayerRef = useRef<any>(null);
	const kmlPolygonsRef = useRef<any[]>([]);
	const kmlMarkersRef = useRef<any[]>([]);
	const kmlAbortControllerRef = useRef<AbortController | null>(null);
	const kmlTooltipRef = useRef<HTMLDivElement | null>(null); // Custom tooltip that follows mouse
	const geoJsonAbortControllerRef = useRef<AbortController | null>(null);
	const geoJsonFeaturesRef = useRef<any[]>([]);
	const polylinesRef = useRef<any[]>([]);
	const [kmlVisible, setKmlVisible] = useState(kmlLayer?.visible ?? false);
	const [geoJsonVisible, setGeoJsonVisible] = useState(geoJsonLayer?.visible ?? false);
	const [markersVisible, setMarkersVisible] = useState(true);
	const [heatmapVisible, setHeatmapVisible] = useState(true);

	// Inject CSS for custom markers once
	useEffect(() => {
		if (typeof document === "undefined") return;
		const styleId = "gis-custom-marker-styles";
		if (!document.getElementById(styleId)) {
			const style = document.createElement("style");
			style.id = styleId;
			style.textContent = `
				.gis-marker { position: absolute; transform: translate(-50%, -50%); pointer-events: auto; }
				.gis-marker-dot { width: 12px; height: 12px; border-radius: 9999px; background: var(--marker-color, #22d3ee); box-shadow: 0 0 12px 4px color-mix(in srgb, var(--marker-color, #22d3ee) 60%, transparent), 0 0 2px 1px rgba(0,0,0,0.6) inset; }
				.gis-marker-pulse { position: absolute; top: 50%; left: 50%; width: 12px; height: 12px; border-radius: 9999px; transform: translate(-50%, -50%); background: var(--marker-color, #22d3ee); opacity: 0.6; filter: blur(2px); animation: gisPulse 2.2s ease-out infinite; }
				@keyframes gisPulse { 0% { transform: translate(-50%, -50%) scale(1); opacity: 0.65; } 70% { transform: translate(-50%, -50%) scale(2.1); opacity: 0.08; } 100% { transform: translate(-50%, -50%) scale(2.6); opacity: 0; } }
				.gis-legend { position: absolute; top: -12px; left: 14px; transform: translateY(-100%); background: #0b1220; color: #e5e7eb; border: 1px solid #1f2937; border-radius: 8px; padding: 8px 10px; white-space: nowrap; font-size: 12px; box-shadow: 0 6px 20px rgba(0,0,0,0.35); opacity: 0; pointer-events: none; transition: opacity .15s ease, transform .15s ease; }
				.gis-legend-header { font-weight: 600; margin-bottom: 2px; color: #cfe9ff; }
				.gis-legend-subtle { color: #93a4b5; font-size: 11px; }
				.gis-marker:hover .gis-legend { opacity: 1; transform: translateY(calc(-100% - 2px)); }
			`;
			document.head.appendChild(style);
		}
	}, []);

	// Helper to create a custom HTML marker using OverlayView
	const createHtmlMarker = (
		position: { lat: number; lng: number },
		options: {
			title?: string;
			label?: string;
			color?: string;
			groupName?: string;
			onClick?: () => void;
		},
	): any => {
		const overlay = new window.google.maps.OverlayView();
		const container = document.createElement("div");
		container.className = "gis-marker";
		container.style.setProperty("--marker-color", options.color || "#22d3ee");
		container.setAttribute("aria-label", options.title || options.label || "Marker");

		const pulse = document.createElement("div");
		pulse.className = "gis-marker-pulse";
		const dot = document.createElement("div");
		dot.className = "gis-marker-dot";

		const legend = document.createElement("div");
		legend.className = "gis-legend";
		legend.innerHTML = `
			<div class="gis-legend-header">${(options.title || options.label || "Point").replace(/'/g, "&apos;")}</div>
			<div class="gis-legend-subtle">${(options.groupName || "Marker").replace(/'/g, "&apos;")}</div>
		`;

		container.appendChild(pulse);
		container.appendChild(dot);
		container.appendChild(legend);

		if (options.onClick) {
			container.addEventListener("click", (e) => {
				e.stopPropagation();
				options.onClick?.();
			});
		}

		overlay.onAdd = function onAdd() {
			const panes = this.getPanes();
			panes.overlayMouseTarget.appendChild(container);
		};

		overlay.draw = function draw() {
			const projection = this.getProjection();
			if (!projection) return;
			const latLng = new window.google.maps.LatLng(position.lat, position.lng);
			const point = projection.fromLatLngToDivPixel(latLng);
			if (point) {
				container.style.left = `${point.x}px`;
				container.style.top = `${point.y}px`;
			}
		};

		overlay.onRemove = function onRemove() {
			if (container.parentNode) container.parentNode.removeChild(container);
		};

		overlay.setMap(mapInstanceRef.current);
		return overlay;
	};

	// Load Google Maps script
	useEffect(() => {
		if (window.google && window.google.maps) {
			setIsLoaded(true);
			return;
		}

		window.initMap = () => {
			setIsLoaded(true);
		};

		const script = document.createElement("script");
		script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyDDs2zpvbxf7cpWK0-5uKpxNtbq91Y7v6A&callback=initMap&libraries=visualization,geometry,places&loading=async";
		script.async = true;
		script.defer = true;
		document.head.appendChild(script);

		return () => {
			if (script.parentNode) {
				script.parentNode.removeChild(script);
			}
		};
	}, []);

	// Initialize map
	useEffect(() => {
		if (isLoaded && mapRef.current && !mapInstanceRef.current) {
			const mapInstance = new window.google.maps.Map(mapRef.current, {
				center,
				zoom,
				mapTypeId: window.google.maps.MapTypeId.ROADMAP,
				styles: [
					{ elementType: "geometry", stylers: [{ color: "#212121" }] },
					{ elementType: "labels.icon", stylers: [{ visibility: "off" }] },
					{ elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
					{ elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
					{
						featureType: "administrative",
						elementType: "geometry",
						stylers: [{ color: "#757575" }],
					},
					{
						featureType: "administrative.country",
						elementType: "labels.text.fill",
						stylers: [{ color: "#9e9e9e" }],
					},
					{
						featureType: "administrative.land_parcel",
						stylers: [{ visibility: "off" }],
					},
					{
						featureType: "administrative.locality",
						elementType: "labels.text.fill",
						stylers: [{ color: "#bdbdbd" }],
					},
					{
						featureType: "poi",
						elementType: "labels.text.fill",
						stylers: [{ color: "#757575" }],
					},
					{
						featureType: "poi.park",
						elementType: "geometry",
						stylers: [{ color: "#181818" }],
					},
					{
						featureType: "poi.park",
						elementType: "labels.text.fill",
						stylers: [{ color: "#616161" }],
					},
					{
						featureType: "poi.park",
						elementType: "labels.text.stroke",
						stylers: [{ color: "#1b1b1b" }],
					},
					{
						featureType: "road",
						elementType: "geometry.fill",
						stylers: [{ color: "#2c2c2c" }],
					},
					{
						featureType: "road",
						elementType: "labels.text.fill",
						stylers: [{ color: "#8a8a8a" }],
					},
					{
						featureType: "road.arterial",
						elementType: "geometry",
						stylers: [{ color: "#373737" }],
					},
					{
						featureType: "road.highway",
						elementType: "geometry",
						stylers: [{ color: "#3c3c3c" }],
					},
					{
						featureType: "road.highway.controlled_access",
						elementType: "geometry",
						stylers: [{ color: "#4e4e4e" }],
					},
					{
						featureType: "road.local",
						elementType: "labels.text.fill",
						stylers: [{ color: "#616161" }],
					},
					{
						featureType: "transit",
						elementType: "labels.text.fill",
						stylers: [{ color: "#757575" }],
					},
					{
						featureType: "water",
						elementType: "geometry",
						stylers: [{ color: "#000000" }],
					},
					{
						featureType: "water",
						elementType: "labels.text.fill",
						stylers: [{ color: "#3d3d3d" }],
					},
				],
			});
			mapInstanceRef.current = mapInstance;
		}
	}, [isLoaded, center, zoom]);

	// Handle markers (custom HTML overlays)
	useEffect(() => {
		if (mapInstanceRef.current && isLoaded) {
			// Clear existing markers
			markersRef.current.forEach((marker) => marker.setMap(null));
			markersRef.current = [];
			groupMarkersRef.current.forEach((groupMarkers) => {
				groupMarkers.forEach((marker) => marker.setMap(null));
			});
			groupMarkersRef.current.clear();

			// Add individual markers as HTML overlays
			markers.forEach((markerData) => {
				const overlay = createHtmlMarker(markerData.position, {
					title: markerData.title || markerData.label || "Marker",
					groupName: "Markers",
					color: undefined,
					onClick: () => {
						if (onPointClick) {
							onPointClick({
								lat: markerData.position.lat,
								lng: markerData.position.lng,
								title: markerData.title || markerData.label,
								group: "Markers",
								meta: markerData.meta,
							});
						}
					},
				});
				markersRef.current.push(overlay);
			});

			// Add grouped markers as HTML overlays
			markerGroups.forEach((group) => {
				const shouldShowGroup = group.visible !== false && markersVisible;
				if (shouldShowGroup) {
					const groupMarkers: any[] = [];
					group.markers.forEach((markerData) => {
						const overlay = createHtmlMarker(markerData.position, {
							title: markerData.title || markerData.label || group.name,
							groupName: group.name,
							color: group.color,
							onClick: () => {
								if (onPointClick) {
									onPointClick({
										lat: markerData.position.lat,
										lng: markerData.position.lng,
										title: markerData.title || markerData.label || group.name,
										group: group.name,
										meta: markerData.meta,
									});
								}
							},
						});
						groupMarkers.push(overlay);
					});
					groupMarkersRef.current.set(group.name, groupMarkers);
				}
			});
		}
	}, [markers, markerGroups, markersVisible, isLoaded, onPointClick]);

	// Handle polylines (procession routes)
	useEffect(() => {
		if (mapInstanceRef.current && isLoaded && window.google?.maps) {
			// Clear existing polylines
			if (polylinesRef.current) {
				polylinesRef.current.forEach((polyline) => {
					polyline.setMap(null);
				});
				polylinesRef.current = [];
			}

			// Render visible polylines
			polylines.forEach((festivalGroup) => {
				if (festivalGroup.visible) {
					festivalGroup.routes.forEach((route) => {
						// Create polyline path
						const path = route.path.map((coord) => new window.google.maps.LatLng(coord.lat, coord.lng));

						// Create main polyline
						const polyline = new window.google.maps.Polyline({
							path: path,
							geodesic: true,
							strokeColor: festivalGroup.color,
							strokeOpacity: 1.0,
							strokeWeight: 5,
							zIndex: 1000, // Above points but below markers
						});

						// Add glow effect with shadow (wider, more transparent)
						const glowPolyline = new window.google.maps.Polyline({
							path: path,
							geodesic: true,
							strokeColor: festivalGroup.color,
							strokeOpacity: 0.4,
							strokeWeight: 15,
							zIndex: 999,
						});

						// Add outer glow effect (even wider, more transparent)
						const outerGlowPolyline = new window.google.maps.Polyline({
							path: path,
							geodesic: true,
							strokeColor: festivalGroup.color,
							strokeOpacity: 0.2,
							strokeWeight: 25,
							zIndex: 998,
						});

						// Add polylines to map
						polyline.setMap(mapInstanceRef.current);
						glowPolyline.setMap(mapInstanceRef.current);
						outerGlowPolyline.setMap(mapInstanceRef.current);

						// Add start marker (green circle without border)
						const startMarker = new window.google.maps.Marker({
							position: new window.google.maps.LatLng(route.startPoint.lat, route.startPoint.lng),
							map: mapInstanceRef.current,
							title: `Start: ${route.start_address}`,
							icon: {
								path: window.google.maps.SymbolPath.CIRCLE,
								scale: 8,
								fillColor: "#22C55E", // Green
								fillOpacity: 1,
								strokeColor: "transparent",
								strokeWeight: 0,
							},
							zIndex: 1001,
						});

						if (onRouteClick) {
							startMarker.addListener("click", () => {
								onRouteClick({
									id: route.id,
									festivalName: festivalGroup.festivalName,
									color: festivalGroup.color,
									festival_name: route.festival_name,
									procession_number: route.procession_number,
									path: route.path,
									startPoint: route.startPoint,
									endPoint: route.endPoint,
									start_address: route.start_address,
									end_address: route.end_address,
									total_distance: route.total_distance,
									description: route.description,
									police_station: (route as unknown as { police_station?: string }).police_station,
									village: (route as unknown as { village?: string }).village,
									start_time: (route as unknown as { start_time?: string | null }).start_time ?? null,
									end_time: (route as unknown as { end_time?: string | null }).end_time ?? null,
									duration_minutes: (route as unknown as { duration_minutes?: number | null }).duration_minutes ?? null,
									expected_crowd: (route as unknown as { expected_crowd?: number | null }).expected_crowd ?? null,
								});
							});
						}

						// Add end marker (red circle without border)
						const endMarker = new window.google.maps.Marker({
							position: new window.google.maps.LatLng(route.endPoint.lat, route.endPoint.lng),
							map: mapInstanceRef.current,
							title: `End: ${route.end_address}`,
							icon: {
								path: window.google.maps.SymbolPath.CIRCLE,
								scale: 8,
								fillColor: "#EF4444", // Red
								fillOpacity: 1,
								strokeColor: "transparent",
								strokeWeight: 0,
							},
							zIndex: 1001,
						});

						if (onRouteClick) {
							endMarker.addListener("click", () => {
								onRouteClick({
									id: route.id,
									festivalName: festivalGroup.festivalName,
									color: festivalGroup.color,
									festival_name: route.festival_name,
									procession_number: route.procession_number,
									path: route.path,
									startPoint: route.startPoint,
									endPoint: route.endPoint,
									start_address: route.start_address,
									end_address: route.end_address,
									total_distance: route.total_distance,
									description: route.description,
									police_station: (route as unknown as { police_station?: string }).police_station,
									village: (route as unknown as { village?: string }).village,
									start_time: (route as unknown as { start_time?: string | null }).start_time ?? null,
									end_time: (route as unknown as { end_time?: string | null }).end_time ?? null,
									duration_minutes: (route as unknown as { duration_minutes?: number | null }).duration_minutes ?? null,
									expected_crowd: (route as unknown as { expected_crowd?: number | null }).expected_crowd ?? null,
								});
							});
						}

						// Route click handlers
						if (onRouteClick) {
							const emit = () => {
								onRouteClick({
									id: route.id,
									festivalName: festivalGroup.festivalName,
									color: festivalGroup.color,
									festival_name: route.festival_name,
									procession_number: route.procession_number,
									path: route.path,
									startPoint: route.startPoint,
									endPoint: route.endPoint,
									start_address: route.start_address,
									end_address: route.end_address,
									total_distance: route.total_distance,
									description: route.description,
									police_station: (route as unknown as { police_station?: string }).police_station,
									village: (route as unknown as { village?: string }).village,
									start_time: (route as unknown as { start_time?: string | null }).start_time ?? null,
									end_time: (route as unknown as { end_time?: string | null }).end_time ?? null,
									duration_minutes: (route as unknown as { duration_minutes?: number | null }).duration_minutes ?? null,
									expected_crowd: (route as unknown as { expected_crowd?: number | null }).expected_crowd ?? null,
								});
							};
							polyline.addListener("click", emit);
							glowPolyline.addListener("click", emit);
							outerGlowPolyline.addListener("click", emit);
						}

						// Store references for cleanup
						polylinesRef.current.push(polyline, glowPolyline, outerGlowPolyline, startMarker, endMarker);
					});
				}
			});
		}
	}, [polylines, isLoaded, onPointClick]);

	// Handle heatmap
	useEffect(() => {
		if (mapInstanceRef.current && isLoaded && window.google?.maps?.visualization) {
			if (heatmapRef.current) {
				heatmapRef.current.setMap(null);
				heatmapRef.current = null;
			}

			if (heatmap && heatmap.data && heatmap.data.length > 0 && heatmapVisible) {
				const heatmapData = heatmap.data.map((point) => {
					if (point.weight !== undefined) {
						return {
							location: new window.google.maps.LatLng(point.position.lat, point.position.lng),
							weight: point.weight,
						};
					} else {
						return new window.google.maps.LatLng(point.position.lat, point.position.lng);
					}
				});

				const heatmapLayer = new window.google.maps.visualization.HeatmapLayer({
					data: heatmapData,
					radius: heatmap.radius || 20,
					opacity: heatmap.opacity || 0.6,
				});

				heatmapLayer.setMap(mapInstanceRef.current);
				heatmapRef.current = heatmapLayer;
			}
		}
	}, [heatmap, heatmapVisible, isLoaded]);

	// Handle Directions (Routing)
	const directionsRendererRef = useRef<any>(null);
	useEffect(() => {
		if (mapInstanceRef.current && isLoaded && window.google?.maps) {
			if (!directionsRendererRef.current) {
				directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
					suppressMarkers: false,
					polylineOptions: {
						strokeColor: "#3b82f6", // Blue-500
						strokeWeight: 5,
						strokeOpacity: 0.8,
					},
				});
				directionsRendererRef.current.setMap(mapInstanceRef.current);
			}

			if (directions) {
				directionsRendererRef.current.setDirections(directions);
			} else {
				directionsRendererRef.current.setDirections({ routes: [] });
			}
		}
	}, [directions, isLoaded]);

	// Enhanced KML Effect using custom parser
	useEffect(() => {
		const handleEnhancedKML = async () => {
			console.log("🎆 KML Effect triggered:", {
				mapReady: !!mapInstanceRef.current,
				isLoaded,
				hasKmlLayer: !!kmlLayer,
				kmlVisible,
				kmlUrl: kmlLayer?.url,
			});

			// ALWAYS clear existing KML elements first - this is critical
			console.log("🧹 Starting KML cleanup process...");
			console.log("🧹 Current state:", {
				kmlLayerRef: !!kmlLayerRef.current,
				polygonCount: kmlPolygonsRef.current.length,
				markerCount: kmlMarkersRef.current.length,
			});

			// Cancel any ongoing KML parsing operations
			if (kmlAbortControllerRef.current) {
				console.log("🛑 Cancelling ongoing KML parsing...");
				kmlAbortControllerRef.current.abort();
				kmlAbortControllerRef.current = null;
			}

			if (kmlLayerRef.current) {
				console.log("🧹 Removing native KML layer");
				try {
					kmlLayerRef.current.setMap(null);
					console.log("✅ Native KML layer removed successfully");
				} catch (error) {
					console.error("❌ Error removing native KML layer:", error);
				}
				kmlLayerRef.current = null;
			}

			// Clear custom polygons with detailed logging
			if (kmlPolygonsRef.current.length > 0) {
				console.log(`🧹 Removing ${kmlPolygonsRef.current.length} polygons...`);
				kmlPolygonsRef.current.forEach((polygon, index) => {
					if (polygon && typeof polygon.setMap === "function") {
						try {
							polygon.setMap(null);
							console.log(`✅ Polygon ${index} removed`);
						} catch (error) {
							console.error(`❌ Error removing polygon ${index}:`, error);
						}
					} else {
						console.warn(`⚠️ Polygon ${index} is invalid:`, polygon);
					}
				});
			} else {
				console.log("🧹 No polygons to remove");
			}

			// Clear custom markers with detailed logging
			if (kmlMarkersRef.current.length > 0) {
				console.log(`🧹 Removing ${kmlMarkersRef.current.length} markers...`);
				kmlMarkersRef.current.forEach((marker, index) => {
					if (marker && typeof marker.setMap === "function") {
						try {
							marker.setMap(null);
							console.log(`✅ Marker ${index} removed`);
						} catch (error) {
							console.error(`❌ Error removing marker ${index}:`, error);
						}
					} else {
						console.warn(`⚠️ Marker ${index} is invalid:`, marker);
					}
				});
			} else {
				console.log("🧹 No markers to remove");
			}

			// Clear the arrays
			kmlPolygonsRef.current = [];
			kmlMarkersRef.current = [];
			console.log("✅ KML cleanup completed - arrays cleared");

			// If prerequisites not met OR KML should be hidden, stop here
			if (!mapInstanceRef.current || !isLoaded || !kmlLayer || !kmlVisible) {
				const reason = !mapInstanceRef.current ? "Map not ready" : !isLoaded ? "Not loaded" : !kmlLayer ? "No KML layer config" : !kmlVisible ? "KML toggled OFF" : "Unknown";

				console.log("⚠️ KML loading stopped - conditions not met:", {
					mapReady: !!mapInstanceRef.current,
					isLoaded,
					hasKmlLayer: !!kmlLayer,
					kmlVisible,
					reason,
				});

				if (!kmlVisible) {
					console.log("✅ KML is toggled OFF - cleanup should have removed all layers");
				}
				return;
			}

			console.log("🎆 Starting KML loading process for:", kmlLayer.url);

			// Create new AbortController for this parsing operation
			const abortController = new AbortController();
			kmlAbortControllerRef.current = abortController;

			try {
				const result = await parseKMLFile(kmlLayer.url!, abortController.signal);

				// Check if this operation was cancelled
				if (abortController.signal.aborted) {
					console.log("🛑 KML parsing was cancelled");
					return;
				}

				if (result.success) {
					console.log("✅ KML parsed successfully:", {
						features: result.features.length,
						markers: result.markers.length,
					});

					// Create custom tooltip element if not exists
					if (!kmlTooltipRef.current) {
						const tooltip = document.createElement('div');
						tooltip.id = 'kml-boundary-tooltip';
						tooltip.style.cssText = `
							position: fixed;
							pointer-events: none;
							z-index: 9999;
							background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
							padding: 8px 12px;
							border-radius: 6px;
							box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
							border: 1px solid rgba(0, 212, 255, 0.4);
							font-family: system-ui, -apple-system, sans-serif;
							display: none;
							transition: opacity 0.15s ease;
						`;
						document.body.appendChild(tooltip);
						kmlTooltipRef.current = tooltip;
					}

					// Default and hover styles for boundaries
					const defaultStyle = {
						strokeColor: "#FF0000",
						strokeOpacity: 0.8,
						strokeWeight: 2,
						fillColor: "#FF0000",
						fillOpacity: 0.35,
					};

					const hoverStyle = {
						strokeColor: "#00D4FF",
						strokeOpacity: 1,
						strokeWeight: 3,
						fillColor: "#00D4FF",
						fillOpacity: 0.5,
					};

					// Render polygon features (boundaries)
					result.features.forEach((feature) => {
						if (feature.type === "polygon") {
							const polygon = new window.google.maps.Polygon({
								paths: feature.coordinates,
								...defaultStyle,
								map: mapInstanceRef.current,
							});

							// Store the area name for mousemove handler
							let currentAreaName = feature.name || 'Unknown Area';

							// Hover effect: highlight on mouseover
							polygon.addListener("mouseover", (event: any) => {
								// Apply hover style
								polygon.setOptions(hoverStyle);

								// Show custom tooltip
								if (kmlTooltipRef.current) {
									kmlTooltipRef.current.innerHTML = `
										<div style="color: #00D4FF; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; opacity: 0.8;">📍 Area</div>
										<div style="color: #ffffff; font-size: 13px; font-weight: 700;">${currentAreaName}</div>
									`;
									kmlTooltipRef.current.style.display = 'block';
								}

								// Callback for external handling
								if (onBoundaryHover && event.latLng) {
									onBoundaryHover({
										name: currentAreaName,
										lat: event.latLng.lat(),
										lng: event.latLng.lng(),
									});
								}
							});

							// Update tooltip position on mouse move within polygon
							polygon.addListener("mousemove", (event: any) => {
								if (kmlTooltipRef.current && event.domEvent) {
									const offsetX = 15;
									const offsetY = 15;
									kmlTooltipRef.current.style.left = `${event.domEvent.clientX + offsetX}px`;
									kmlTooltipRef.current.style.top = `${event.domEvent.clientY + offsetY}px`;
								}
							});

							// Reset style on mouseout
							polygon.addListener("mouseout", () => {
								polygon.setOptions(defaultStyle);

								// Hide custom tooltip
								if (kmlTooltipRef.current) {
									kmlTooltipRef.current.style.display = 'none';
								}

								// Callback for external handling
								if (onBoundaryHover) {
									onBoundaryHover(null);
								}
							});

							// Click handler (existing)
							polygon.addListener("click", (event: any) => {
								if (onPointClick && event.latLng) {
									onPointClick({
										lat: event.latLng.lat(),
										lng: event.latLng.lng(),
										title: feature.name,
										group: "Nashik Gramin Boundaries",
									});
								}
							});

							kmlPolygonsRef.current.push(polygon);
						}
					});

					// Render police station markers as overlays with hover legends
					result.markers.forEach((markerData) => {
						const title = markerData.title || "Police Station";
						const overlay = createHtmlMarker(markerData.position, {
							title,
							label: "PS",
							groupName: "Police Stations",
							color: "#60a5fa",
							onClick: () => {
								if (onPointClick) {
									onPointClick({
										lat: markerData.position.lat,
										lng: markerData.position.lng,
										title,
										group: "Police Stations",
									});
								}
							},
						});
						kmlMarkersRef.current.push(overlay);
					});

					console.log("✅ KML rendering completed successfully");
				}

				// Clear the abort controller if this is still the current operation
				if (kmlAbortControllerRef.current === abortController) {
					kmlAbortControllerRef.current = null;
				}
			} catch (error) {
				// Don't log error if operation was cancelled (AbortError is expected)
				if (!abortController.signal.aborted && !(error instanceof Error && error.name === "AbortError")) {
					console.error("❌ Enhanced KML effect error:", error);
				}

				// Clear the abort controller if this is still the current operation
				if (kmlAbortControllerRef.current === abortController) {
					kmlAbortControllerRef.current = null;
				}
			}
		};

		handleEnhancedKML();
	}, [kmlLayer, kmlVisible, isLoaded, onPointClick, onBoundaryHover]);

	// Enhanced GeoJSON Effect with proper cleanup
	useEffect(() => {
		const handleEnhancedGeoJSON = async () => {
			console.log("🌍 GeoJSON Effect triggered:", {
				mapReady: !!mapInstanceRef.current,
				isLoaded,
				hasGeoJsonLayer: !!geoJsonLayer,
				geoJsonVisible,
				geoJsonUrl: geoJsonLayer?.url,
			});

			// ALWAYS clear existing GeoJSON elements first - this is critical
			console.log("🧹 Starting GeoJSON cleanup process...");
			console.log("🧹 Current GeoJSON state:", {
				geoJsonLayerRef: !!geoJsonLayerRef.current,
				featureCount: geoJsonFeaturesRef.current.length,
			});

			// Cancel any ongoing GeoJSON loading operations
			if (geoJsonAbortControllerRef.current) {
				console.log("🛑 Cancelling ongoing GeoJSON loading...");
				geoJsonAbortControllerRef.current.abort();
				geoJsonAbortControllerRef.current = null;
			}

			// Clear existing GeoJSON features with detailed logging
			if (mapInstanceRef.current && mapInstanceRef.current.data) {
				try {
					// Method 1: Remove all features from the data layer
					console.log("🧹 Clearing all features from data layer...");
					mapInstanceRef.current.data.forEach((feature: any) => {
						mapInstanceRef.current.data.remove(feature);
					});

					// Method 2: Clear tracked features array
					if (geoJsonFeaturesRef.current.length > 0) {
						console.log(`🧹 Removing ${geoJsonFeaturesRef.current.length} tracked features...`);
						geoJsonFeaturesRef.current.forEach((feature, index) => {
							if (feature && mapInstanceRef.current && mapInstanceRef.current.data) {
								try {
									mapInstanceRef.current.data.remove(feature);
									console.log(`✅ Feature ${index} removed`);
								} catch (error) {
									console.error(`❌ Error removing feature ${index}:`, error);
								}
							} else {
								console.warn(`⚠️ Feature ${index} is invalid:`, feature);
							}
						});
					} else {
						console.log("🧹 No tracked features to remove");
					}

					console.log("✅ GeoJSON cleanup completed successfully");
				} catch (error) {
					console.error("❌ Error during GeoJSON cleanup:", error);
				}
			}

			// Clear the arrays and refs
			geoJsonFeaturesRef.current = [];
			geoJsonLayerRef.current = null;
			console.log("✅ GeoJSON cleanup completed - arrays cleared");

			// If prerequisites not met OR GeoJSON should be hidden, stop here
			if (!mapInstanceRef.current || !isLoaded || !geoJsonLayer || !geoJsonVisible) {
				const reason = !mapInstanceRef.current ? "Map not ready" : !isLoaded ? "Not loaded" : !geoJsonLayer ? "No GeoJSON layer config" : !geoJsonVisible ? "GeoJSON toggled OFF" : "Unknown";

				console.log("⚠️ GeoJSON loading stopped - conditions not met:", {
					mapReady: !!mapInstanceRef.current,
					isLoaded,
					hasGeoJsonLayer: !!geoJsonLayer,
					geoJsonVisible,
					reason,
				});

				if (!geoJsonVisible) {
					console.log("✅ GeoJSON is toggled OFF - cleanup should have removed all layers");
				}
				return;
			}

			console.log("🌍 Starting GeoJSON loading process...");

			// Create new AbortController for this loading operation
			const abortController = new AbortController();
			geoJsonAbortControllerRef.current = abortController;

			try {
				if (geoJsonLayer.data) {
					console.log("📄 Loading GeoJSON from data object...");

					// Check if operation was cancelled
					if (abortController.signal.aborted) {
						console.log("🛑 GeoJSON loading was cancelled");
						return;
					}

					const features = mapInstanceRef.current.data.addGeoJson(geoJsonLayer.data);
					geoJsonFeaturesRef.current.push(...features);
					console.log(`✅ Added ${features.length} features from data object`);
				} else if (geoJsonLayer.url) {
					console.log("🌐 Loading GeoJSON from URL:", geoJsonLayer.url);

					// Check if operation was cancelled
					if (abortController.signal.aborted) {
						console.log("🛑 GeoJSON loading was cancelled");
						return;
					}

					// Load from URL with promise handling
					const loadPromise = new Promise<any[]>((resolve, reject) => {
						mapInstanceRef.current.data.loadGeoJson(
							geoJsonLayer.url!,
							{
								idPropertyName: "id",
							},
							(features: any[]) => {
								if (abortController.signal.aborted) {
									reject(new Error("Operation cancelled"));
									return;
								}
								resolve(features);
							},
						);
					});

					const features = await loadPromise;
					geoJsonFeaturesRef.current.push(...features);
					console.log(`✅ Added ${features.length} features from URL`);
				}

				// Apply styling if provided
				if (geoJsonLayer.style && !abortController.signal.aborted) {
					console.log("🎨 Applying GeoJSON styling...");
					mapInstanceRef.current.data.setStyle(geoJsonLayer.style);
					console.log("✅ GeoJSON styling applied");
				}

				// Add click listeners to features
				if (!abortController.signal.aborted) {
					mapInstanceRef.current.data.addListener("click", (event: any) => {
						if (onPointClick && event.latLng) {
							onPointClick({
								lat: event.latLng.lat(),
								lng: event.latLng.lng(),
								title: event.feature?.getProperty("name") || "GeoJSON Feature",
								group: "GeoJSON Layer",
							});
						}
					});
				}

				geoJsonLayerRef.current = true;
				console.log("✅ GeoJSON loading completed successfully");

				// Clear the abort controller if this is still the current operation
				if (geoJsonAbortControllerRef.current === abortController) {
					geoJsonAbortControllerRef.current = null;
				}
			} catch (error) {
				// Don't log error if operation was cancelled (AbortError is expected)
				if (!abortController.signal.aborted && !(error instanceof Error && error.name === "AbortError")) {
					console.error("❌ Enhanced GeoJSON effect error:", error);
				}

				// Clear the abort controller if this is still the current operation
				if (geoJsonAbortControllerRef.current === abortController) {
					geoJsonAbortControllerRef.current = null;
				}
			}
		};

		handleEnhancedGeoJSON();
	}, [geoJsonLayer, geoJsonVisible, isLoaded, onPointClick]);

	// Handle selected point navigation
	useEffect(() => {
		if (mapInstanceRef.current && selectedPoint) {
			const targetZoom = selectedPoint.zoom || 15;
			mapInstanceRef.current.panTo(selectedPoint);
			mapInstanceRef.current.setZoom(targetZoom);
		}
	}, [selectedPoint]);

	// Listen to map bounds changes (idle event for performance)
	useEffect(() => {
		if (!mapInstanceRef.current || !isLoaded || !onBoundsChanged) return;

		const listener = mapInstanceRef.current.addListener("idle", () => {
			if (!mapInstanceRef.current) return;
			const bounds = mapInstanceRef.current.getBounds();
			const zoom = mapInstanceRef.current.getZoom();
			if (bounds && zoom !== undefined) {
				const ne = bounds.getNorthEast();
				const sw = bounds.getSouthWest();
				onBoundsChanged({
					north: ne.lat(),
					south: sw.lat(),
					east: ne.lng(),
					west: sw.lng(),
					zoom: zoom,
				});
			}
		});

		return () => {
			if (listener && window.google?.maps?.event) {
				window.google.maps.event.removeListener(listener);
			}
		};
	}, [isLoaded, onBoundsChanged]);

	// Sync internal state with props
	useEffect(() => {
		if (kmlLayer?.visible !== undefined) {
			setKmlVisible(kmlLayer.visible);
		}
	}, [kmlLayer?.visible]);

	useEffect(() => {
		if (geoJsonLayer?.visible !== undefined) {
			setGeoJsonVisible(geoJsonLayer.visible);
		}
	}, [geoJsonLayer?.visible]);

	useEffect(() => {
		if (heatmap?.visible !== undefined) {
			setHeatmapVisible(heatmap.visible);
		}
	}, [heatmap?.visible]);

	// Toggle functions
	const toggleKML = () => {
		const newVisible = !kmlVisible;
		setKmlVisible(newVisible);
		if (onKMLToggle) {
			onKMLToggle(newVisible);
		}
	};

	const toggleGeoJSON = () => {
		const newVisible = !geoJsonVisible;
		setGeoJsonVisible(newVisible);
		if (onGeoJSONToggle) {
			onGeoJSONToggle(newVisible);
		}
	};

	const toggleMarkers = () => {
		const newVisible = !markersVisible;
		setMarkersVisible(newVisible);
		if (onMarkersToggle) {
			onMarkersToggle(newVisible);
		}
	};

	const toggleHeatmap = () => {
		const newVisible = !heatmapVisible;
		setHeatmapVisible(newVisible);
		if (onHeatmapToggle) {
			onHeatmapToggle(newVisible);
		}
	};

	if (!isLoaded) {
		return (
			<div
				className={`flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg ${className}`}
				style={{ height, width }}
			>
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
					<p className="text-gray-600">Loading Google Maps...</p>
				</div>
			</div>
		);
	}

	return (
		<div
			className={`relative ${className}`}
			style={{ height, width }}
		>
			{/* Layer Controls */}
			{showLayerControls && (
				<div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-3 space-y-3">
					<div className="text-sm font-semibold text-gray-700 mb-2">Map Layers</div>
					{kmlLayer && (
						<div className="flex items-center justify-between text-sm">
							<span className="text-gray-700">KML Layer</span>
							<Toggle
								checked={kmlVisible}
								onCheckedChange={toggleKML}
								variant="success"
							/>
						</div>
					)}
					{markerGroups.length > 0 && (
						<div className="flex items-center justify-between text-sm">
							<span className="text-gray-700">Markers</span>
							<Toggle
								checked={markersVisible}
								onCheckedChange={toggleMarkers}
								variant="default"
							/>
						</div>
					)}
					{heatmap && (
						<div className="flex items-center justify-between text-sm">
							<span className="text-gray-700">Heatmap</span>
							<Toggle
								checked={heatmapVisible}
								onCheckedChange={toggleHeatmap}
								variant="warning"
							/>
						</div>
					)}
					{geoJsonLayer && (
						<div className="flex items-center justify-between text-sm">
							<span className="text-gray-700">GeoJSON Layer</span>
							<Toggle
								checked={geoJsonVisible}
								onCheckedChange={toggleGeoJSON}
								variant="default"
							/>
						</div>
					)}
				</div>
			)}

			{/* Map Container */}
			<div
				ref={mapRef}
				className="rounded-lg border border-gray-300 shadow-lg w-full h-full"
			/>

			{/* Add the GooeyFilter for the liquid toggle effects */}
			<GooeyFilter />
		</div>
	);
}
