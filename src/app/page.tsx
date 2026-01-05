"use client";

import GoogleMap from "@/components/GoogleMap";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import Sidebar from "@/components/Sidebar";
import { SliderV1 } from "@/components/NewToggle";
import { parseKMLFile, type KMLFeature, type KMLMarker } from "@/utils/kmlParser";
import { isPointNearPath, isPointInPolygon, findContainingBoundary, filterPointsInBoundary, calculateDistance } from "@/utils/geoUtils";
import { AnimatePresence } from "framer-motion";
import StreetViewPopup from "@/components/StreetViewPopup";
import OfficerPopup from "@/components/OfficerPopup";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
	fetchCCTVLocations,
	type CCTVLocation,
	fetchATMLocations,
	type ATMLocation,
	fetchBankLocations,
	type BankLocation,
	fetchHospitals,
	type Hospital,
	type Dial112Call,
	streamDial112Calls,
	fetchDial112Calls,
	type AccidentRecord,
	streamAccidentData,
	fetchAccidentRecords,
	fetchMapData,
	type MapDataPoint,
	fetchProcessionRoutes,
	type ProcessionRoute,
	fetchCategories,
	fetchCategoryPoints,
	type Category,
	type Subcategory,
	fetchPoliceStations,
	type PoliceStation,
} from "@/services/externalApi";
import { getDutyOfficersLocations, type OfficerDutyLocation, type OfficersLocationsResponse } from "@/services/smartBandobastApis";

// Emergency Tab Component
function EmergencyTab({
	hospitals = [],
	policeStations = [],
	dial112Calls = [],
	officers = [],
	currentCenter,
	onLocateNearest,
	onDrawRoute,
}: {
	hospitals?: Hospital[];
	policeStations?: PoliceStation[];
	dial112Calls?: Dial112Call[];
	officers?: OfficerDutyLocation[];
	currentCenter: { lat: number; lng: number };
	onLocateNearest: (point: { lat: number; lng: number; title: string, type: string }) => void;
	onDrawRoute?: (result: any) => void;
}) {
	const findNearest = (type: "hospital" | "police") => {
		// Helper to execute search with a specific origin location
		const executeSearch = (origin: { lat: number; lng: number }) => {


			// Hospital & Police: Use Google Maps Places API for better accuracy
			if (typeof window !== "undefined" && (window as any).google && (window as any).google.maps) {
				const google = (window as any).google;
				const service = new google.maps.places.PlacesService(document.createElement("div"));

				const request = {
					location: origin,
					rankBy: google.maps.places.RankBy.DISTANCE,
					keyword: type === "hospital" ? "hospital" : "police station",
					openNow: true,
				};

				service.nearbySearch(request, (results: any[], status: any) => {
					if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
						const first = results[0];
						if (first.geometry && first.geometry.location) {
							onLocateNearest({
								lat: first.geometry.location.lat(),
								lng: first.geometry.location.lng(),
								title: first.name,
								type: type === "hospital" ? "Hospital" : "Police Station",
							});

							// Draw route if callback provided
							if (onDrawRoute) {
								const directionsService = new google.maps.DirectionsService();
								directionsService.route(
									{
										origin: origin,
										destination: first.geometry.location,
										travelMode: google.maps.TravelMode.DRIVING,
									},
									(result: any, status: any) => {
										if (status === google.maps.DirectionsStatus.OK) {
											onDrawRoute(result);
										} else {
											console.warn("Directions request failed due to " + status);
										}
									}
								);
							}
						}
					} else {
						console.warn(`Google Maps search for ${type} failed:`, status);
					}
				});
			}
		};

		// 1. Try to get real user location first
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					// Success: Use User's GPS Location
					executeSearch({
						lat: position.coords.latitude,
						lng: position.coords.longitude
					});
				},
				(error) => {
					console.warn("Geolocation failed/denied, falling back to map center:", error);
					// Error/Denied: Fallback to current map center
					executeSearch(currentCenter);
				}
			);
		} else {
			// No support: Fallback to current map center
			executeSearch(currentCenter);
		}
	};

	// Find nearby active incidents (within 5km)
	const nearbyIncidents = useMemo(() => {
		return dial112Calls
			.map(call => ({
				...call,
				distance: calculateDistance(currentCenter, { lat: call.latitude, lng: call.longitude })
			}))
			.filter(item => item.distance <= 5000) // 5km radius
			.sort((a, b) => a.distance - b.distance)
			.slice(0, 3); // Top 3 closest
	}, [dial112Calls, currentCenter]);

	return (
		<div className="space-y-4">
			<div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center">
				<h3 className="text-lg font-bold text-red-400 mb-1">Emergency Mode</h3>
				<p className="text-xs text-red-200">Quickly locate nearest safe spots</p>
			</div>

			<div className="grid grid-cols-1 gap-3">
				<button
					onClick={() => findNearest("police")}
					className="flex items-center justify-between p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg shadow-blue-900/20 group"
				>
					<div className="flex items-center gap-3">
						<div className="p-2 bg-white/20 rounded-lg">
							<span className="text-xl">🚔</span>
						</div>
						<div className="text-left">
							<div className="font-bold">Nearest Police Station</div>
							<div className="text-xs text-blue-200 group-hover:text-white">Click to locate & route</div>
						</div>
					</div>
					<svg className="w-5 h-5 text-blue-300 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
					</svg>
				</button>

				<button
					onClick={() => findNearest("hospital")}
					className="flex items-center justify-between p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-lg shadow-emerald-900/20 group"
				>
					<div className="flex items-center gap-3">
						<div className="p-2 bg-white/20 rounded-lg">
							<span className="text-xl">🏥</span>
						</div>
						<div className="text-left">
							<div className="font-bold">Nearest Hospital</div>
							<div className="text-xs text-emerald-200 group-hover:text-white">Click to locate & route</div>
						</div>
					</div>
					<svg className="w-5 h-5 text-emerald-300 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
					</svg>
				</button>


			</div>

			{/* Nearby Active Incidents */}
			{nearbyIncidents.length > 0 && (
				<div className="mt-4">
					<h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Nearby Active Incidents</h4>
					<div className="space-y-2">
						{nearbyIncidents.map((incident) => (
							<button
								key={incident.id}
								onClick={() => onLocateNearest({
									lat: incident.latitude,
									lng: incident.longitude,
									title: incident.callType,
									type: "Dial 112 Call"
								})}
								className="w-full text-left p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors group"
							>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<span className="text-red-400">🚨</span>
										<div>
											<div className="text-sm font-medium text-red-200 group-hover:text-red-100">{incident.callType}</div>
											<div className="text-xs text-red-400/70">{(incident.distance / 1000).toFixed(1)} km away</div>
										</div>
									</div>
									<svg className="w-4 h-4 text-red-400/50 group-hover:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
									</svg>
								</div>
							</button>
						))}
					</div>
				</div>
			)}


		</div>
	);
}

// Comprehensive report component for procession routes
function ProcessionReport({ route, dial112Calls, accidentRecords, allMapPoints }: { route: any; dial112Calls: any[]; accidentRecords: any[]; allMapPoints: any[] }) {
	const [trafficStatus, setTrafficStatus] = useState<any>(null);
	const [trafficLoading, setTrafficLoading] = useState(false);

	const stats = useMemo(() => {
		if (!route?.path) return null;
		const path = route.path.map((p: any) => ({ lat: p.lat, lng: p.lng })); // Ensure format

		// Religious Places
		const religiousKeywords = ["temple", "mosque", "church", "dargah", "gurudwara", "mandir", "masjid"];
		const religiousPlaces = allMapPoints.filter((p: any) => {
			const name = (p.name || "").toLowerCase();
			const cat = (p.category_name || "").toLowerCase();
			const isReligious = religiousKeywords.some((k) => name.includes(k) || cat.includes(k));
			if (!isReligious) return false;
			// Use simple bounding box first for speed, then geo check
			return isPointNearPath({ lat: Number(p.latitude), lng: Number(p.longitude) }, path, 300);
		});

		// Dial 112 (Critical/Emergency only or all?) - Let's count all nearby
		const crimes = dial112Calls.filter((c: any) =>
			isPointNearPath({ lat: c.latitude, lng: c.longitude }, path, 500)
		);

		// Accidents
		const accidents = accidentRecords.filter((a: any) =>
			isPointNearPath({ lat: a.latitude, lng: a.longitude }, path, 500)
		);

		return {
			religiousCount: religiousPlaces.length,
			crimeCount: crimes.length,
			accidentCount: accidents.length,
			religiousPlaces,
		};
	}, [route, dial112Calls, accidentRecords, allMapPoints]);

	const checkTraffic = () => {
		if (!window.google?.maps) return;
		setTrafficLoading(true);
		const dirs = new window.google.maps.DirectionsService();
		dirs.route(
			{
				origin: route.startPoint,
				destination: route.endPoint,
				travelMode: window.google.maps.TravelMode.DRIVING,
				drivingOptions: {
					departureTime: new Date(),
					trafficModel: window.google.maps.TrafficModel.BEST_GUESS,
				},
			},
			(res, status) => {
				setTrafficLoading(false);
				if (status === "OK" && res) {
					const leg = res.routes[0].legs[0];
					setTrafficStatus({
						duration: leg.duration?.text,
						durationTraffic: leg.duration_in_traffic?.text,
						distance: leg.distance?.text,
					});
				}
			}
		);
	};

	if (!route) return null;

	return (
		<div className="space-y-4 border-t border-gray-700/50 pt-4 mt-2">
			<h4 className="text-sm font-semibold text-gray-200 uppercase tracking-wider flex items-center gap-2">
				🛡️ Safety & Traffic Report
			</h4>

			<div className="grid grid-cols-3 gap-2 text-center">
				<div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 flex flex-col items-center justify-center">
					<div className="text-xl font-bold text-amber-400">{stats?.religiousCount || 0}</div>
					<div className="text-[10px] text-amber-200 uppercase leading-none mt-1">Religious Places</div>
				</div>
				<div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2 flex flex-col items-center justify-center">
					<div className="text-xl font-bold text-purple-400">{stats?.crimeCount || 0}</div>
					<div className="text-[10px] text-purple-200 uppercase leading-none mt-1">112 Calls (500m)</div>
				</div>
				<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 flex flex-col items-center justify-center">
					<div className="text-xl font-bold text-red-400">{stats?.accidentCount || 0}</div>
					<div className="text-[10px] text-red-200 uppercase leading-none mt-1">Accidents (500m)</div>
				</div>
			</div>

			<div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3">
				<div className="flex items-center justify-between mb-2">
					<span className="text-xs font-medium text-blue-200">🚦 Traffic Analysis</span>
					{!trafficStatus && (
						<button
							onClick={checkTraffic}
							disabled={trafficLoading}
							className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded transition-colors disabled:opacity-50"
						>
							{trafficLoading ? "Checking..." : "Check Live Traffic"}
						</button>
					)}
				</div>

				{trafficStatus ? (
					<div className="space-y-2 text-xs">
						<div className="flex justify-between items-center bg-black/20 p-1.5 rounded">
							<span className="text-gray-400">Typical:</span>
							<span className="text-gray-200 font-mono">{trafficStatus.duration}</span>
						</div>
						<div className="flex justify-between items-center bg-black/20 p-1.5 rounded">
							<span className="text-gray-400">Current Traffic:</span>
							<span
								className={`font-bold font-mono ${trafficStatus.durationTraffic !== trafficStatus.duration ? "text-orange-400" : "text-green-400"
									}`}
							>
								{trafficStatus.durationTraffic}
							</span>
						</div>
						<div className="mt-2 text-[10px] text-gray-500 text-center italic">
							*Based on Google Maps real-time traffic data
						</div>
					</div>
				) : (
					<div className="text-[10px] text-gray-500 text-center py-2">
						Click to fetch real-time traffic estimates.
					</div>
				)}
			</div>

			{/* Recommendation */}
			<div
				className={`p-3 rounded-lg border flex items-start gap-3 ${stats && (stats.crimeCount > 5 || stats.accidentCount > 5)
					? "bg-red-900/20 border-red-500/30"
					: stats && (stats.crimeCount > 0 || stats.accidentCount > 0)
						? "bg-yellow-900/20 border-yellow-500/30"
						: "bg-green-900/20 border-green-500/30"
					}`}
			>
				<div className="text-2xl pt-0.5">
					{stats && (stats.crimeCount > 5 || stats.accidentCount > 5)
						? "⚠️"
						: stats && (stats.crimeCount > 0 || stats.accidentCount > 0)
							? "✋"
							: "✅"}
				</div>
				<div>
					<div
						className="text-xs font-bold uppercase mb-1"
						style={{
							color:
								stats && (stats.crimeCount > 5 || stats.accidentCount > 5)
									? "#fca5a5"
									: stats && (stats.crimeCount > 0 || stats.accidentCount > 0)
										? "#fcd34d"
										: "#86efac",
						}}
					>
						VIIP Route Assessment
					</div>
					<p className="text-[11px] leading-relaxed text-gray-300">
						{stats && (stats.crimeCount > 5 || stats.accidentCount > 5)
							? "High caution recommended. Significant history of incidents detected along this path."
							: stats && (stats.crimeCount > 0 || stats.accidentCount > 0)
								? "Moderate caution advised. Some incidents reported nearby."
								: "Route appears clear of major reported incidents. Good for travel."}
					</p>
				</div>
			</div>
		</div>
	);
}

export default function Home() {
	// State for selected point and search
	const [selectedPoint, setSelectedPoint] = useState<{ lat: number; lng: number; zoom?: number } | undefined>();
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<Array<{ id: string | number; title: string; subtitle?: string; type: string; position: { lat: number; lng: number } }>>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [clickedPoint, setClickedPoint] = useState<{ lat: number; lng: number; title?: string; group?: string; meta?: Record<string, unknown> } | null>(null);
	const [selectedRoute, setSelectedRoute] = useState<{
		id: number;
		festivalName: string;
		color: string;
		festival_name: string;
		procession_number: string;
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
	} | null>(null);
	const [kmlLayerVisible, setKmlLayerVisible] = useState(false); // Start disabled by default
	const [geoJsonLayerVisible, setGeoJsonLayerVisible] = useState(false);
	const [cctvLayerVisible, setCctvLayerVisible] = useState(false); // New CCTV layer toggle
	const [dial112Visible, setDial112Visible] = useState(false); // Dial 112 points toggle
	const [dial112HeatmapVisible, setDial112HeatmapVisible] = useState(false); // Dial 112 heatmap toggle
	const [accidentVisible, setAccidentVisible] = useState(false); // Accident points toggle
	const [accidentHeatmapVisible, setAccidentHeatmapVisible] = useState(false); // Accident heatmap toggle
	const [officerList, setOfficerList] = useState<OfficerDutyLocation[]>([]);
	const [officerSummary, setOfficerSummary] = useState<OfficersLocationsResponse["data"] | null>(null);
	const [officerLoading, setOfficerLoading] = useState(false);
	const [officerError, setOfficerError] = useState<string | null>(null);
	const [officerSearch, setOfficerSearch] = useState("");
	const [officerAutoRefresh, setOfficerAutoRefresh] = useState(true);
	const [officerLastUpdated, setOfficerLastUpdated] = useState<Date | null>(null);
	const [officerPanelActive, setOfficerPanelActive] = useState(false);
	const [selectedOfficer, setSelectedOfficer] = useState<OfficerDutyLocation | null>(null);
	const [directions, setDirections] = useState<any>(null); // Google Maps DirectionsResult

	// ATM layer state
	const [atmLayerVisible, setAtmLayerVisible] = useState(false);
	const [atmLocations, setAtmLocations] = useState<ATMLocation[]>([]);
	const [atmLoading, setAtmLoading] = useState(false);
	const [atmHeatmapVisible, setAtmHeatmapVisible] = useState(false);

	// Bank layer state
	const [bankLayerVisible, setBankLayerVisible] = useState(false);
	const [bankLocations, setBankLocations] = useState<BankLocation[]>([]);
	const [bankLoading, setBankLoading] = useState(false);
	const [bankHeatmapVisible, setBankHeatmapVisible] = useState(false);

	// Hospital layer state
	const [hospitalLayerVisible, setHospitalLayerVisible] = useState(false);
	const [hospitalLocations, setHospitalLocations] = useState<Hospital[]>([]);
	const [hospitalLoading, setHospitalLoading] = useState(false);
	const [hospitalHeatmapVisible, setHospitalHeatmapVisible] = useState(false);

	// Police station layer state
	const [policeLayerVisible, setPoliceLayerVisible] = useState(false);
	const [policeLocations, setPoliceLocations] = useState<MapDataPoint[]>([]);
	const [policeLoading, setPoliceLoading] = useState(false);
	const [policeHeatmapVisible, setPoliceHeatmapVisible] = useState(false);

	// Procession routes state
	const [processionRoutes, setProcessionRoutes] = useState<ProcessionRoute[]>([]);
	const [processionLoading, setProcessionLoading] = useState(false);
	const [processionsVisible, setProcessionsVisible] = useState<{ [festivalName: string]: boolean }>({});

	// Category state
	const [categories, setCategories] = useState<Category[]>([]);
	const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
	const [categoryToggles, setCategoryToggles] = useState<Record<number, boolean>>({});
	const [subcategoryToggles, setSubcategoryToggles] = useState<Record<number, Record<number, boolean>>>({});
	const [categoryData, setCategoryData] = useState<Record<number, MapDataPoint[]>>({});
	const [categoryLoading, setCategoryLoading] = useState<Record<number, boolean>>({});

	// External API data state
	const [cctvLocations, setCctvLocations] = useState<CCTVLocation[]>([]);
	const [cctvLoading, setCctvLoading] = useState(false);
	const [dial112AllCalls, setDial112AllCalls] = useState<Dial112Call[]>([]); // All calls cached
	const [dial112Calls, setDial112Calls] = useState<Dial112Call[]>([]); // Visible in viewport
	const [dial112Loading, setDial112Loading] = useState(false);
	const dial112LoadingRef = useRef(false); // Track if SSE is in progress
	const [accidentAllRecords, setAccidentAllRecords] = useState<AccidentRecord[]>([]); // All records cached
	const [accidentRecords, setAccidentRecords] = useState<AccidentRecord[]>([]); // Visible in viewport
	const [accidentLoading, setAccidentLoading] = useState(false);
	const accidentLoadingRef = useRef(false); // Track if SSE is in progress
	const [mapBounds, setMapBounds] = useState<{
		north: number;
		south: number;
		east: number;
		west: number;
		zoom: number;
	} | null>(null);

	// Cached KML features (villages/boundaries) and police stations for enrichment
	const [kmlFeatures, setKmlFeatures] = useState<KMLFeature[] | null>(null);
	const [kmlMarkers, setKmlMarkers] = useState<KMLMarker[] | null>(null);
	const [policeStations, setPoliceStations] = useState<PoliceStation[] | null>(null);

	// Area View state - for exploring data within a selected boundary
	const [selectedBoundary, setSelectedBoundary] = useState<KMLFeature | null>(null);
	const [sidebarActiveSection, setSidebarActiveSection] = useState<string | null>(null);

	// Area-specific layer toggles (only show points within selected boundary)
	const [areaLayerToggles, setAreaLayerToggles] = useState<Record<string | number, boolean>>({
		dial112: false,
		dial112Heatmap: false,
		accidents: false,
		accidentsHeatmap: false,
		police: false,
		policeHeatmap: false,
		hospitals: false,
		hospitalsHeatmap: false,
		atms: false,
		atmsHeatmap: false,
		banks: false,
		banksHeatmap: false,
		cctv: false,
	});

	// State for absolute URLs (client-side only)
	const [kmlAbsoluteUrl, setKmlAbsoluteUrl] = useState("/kml/nashik_gramin.kml");

	// Only construct absolute URL for GoogleMap component
	useEffect(() => {
		if (typeof window !== "undefined") {
			setKmlAbsoluteUrl(`${window.location.origin}/kml/nashik_gramin.kml`);
		}
	}, []);

	// Pre-load KML features for area-based search
	useEffect(() => {
		const loadKMLFeatures = async () => {
			if (!kmlFeatures && typeof window !== "undefined") {
				try {
					console.log("🗺️ Pre-loading KML features for area search...");
					const { parseKMLFile } = await import("@/utils/kmlParser");
					const parsed = await parseKMLFile(`${window.location.origin}/kml/nashik_gramin.kml`);
					if (parsed.success) {
						setKmlFeatures(parsed.features);
						setKmlMarkers(parsed.markers);
						console.log(`✅ Pre-loaded ${parsed.features.length} KML boundaries`);
					} else {
						console.error("❌ Failed to parse KML file");
					}
				} catch (error) {
					console.error("❌ Error pre-loading KML features:", error);
				}
			}
		};

		loadKMLFeatures();
	}, [kmlFeatures]);

	// Search implementation
	const handleSearch = useCallback(
		async (query: string) => {
			setSearchQuery(query);

			if (query.trim().length < 2) {
				setSearchResults([]);
				return;
			}

			setIsSearching(true);
			// Simple plural handling: remove trailing 's' if present to match "stations" -> "station"
			const normalizedQuery = query.toLowerCase().trim();
			const searchTerms = [normalizedQuery];
			if (normalizedQuery.endsWith("s")) {
				searchTerms.push(normalizedQuery.slice(0, -1));
			}

			// Helper to check if any field matches any search term
			const matches = (fields: (string | null | undefined)[]) => {
				return searchTerms.some((term) =>
					fields.some((field) => String(field || "").toLowerCase().includes(term))
				);
			};

			// === SMART AREA-BASED SEARCH ===
			// Detect if user is searching for location types within specific areas
			let areaSearchMode = false;
			let targetBoundary: KMLFeature | null = null;
			let dataType: 'police' | 'hospital' | 'bank' | 'atm' | 'cctv' | 'accident' | 'dial112' | 'crime' | 'all' | null = null;

			// Parse natural language queries like:
			// - "police stations in vani"
			// - "hospitals in dindori"  
			// - "banks near nashik"
			const areaPatterns = [
				// Specific location types + in/at/near + area name
				/(?:police\s*(?:stations?)?)\s+(?:in|at|near)\s+(.+)/i,
				/(?:hospitals?|medical)\s+(?:in|at|near)\s+(.+)/i,
				/(?:banks?)\s+(?:in|at|near)\s+(.+)/i,
				/(?:atms?)\s+(?:in|at|near)\s+(.+)/i,
				/(?:cctv|cameras?)\s+(?:in|at|near)\s+(.+)/i,
				/(?:accidents?)\s+(?:in|at|near)\s+(.+)/i,
				/(?:dial\s*112|emergency)\s+(?:in|at|near)\s+(.+)/i,
				/(?:crimes?|fir)\s+(?:in|at|near)\s+(.+)/i,
			];

			for (const pattern of areaPatterns) {
				const match = normalizedQuery.match(pattern);
				if (match) {
					areaSearchMode = true;
					const areaName = match[1].trim();

					// Determine data type from query
					if (normalizedQuery.includes('police')) {
						dataType = 'police';
					} else if (normalizedQuery.includes('hospital') || normalizedQuery.includes('medical')) {
						dataType = 'hospital';
					} else if (normalizedQuery.includes('bank') && !normalizedQuery.includes('atm')) {
						dataType = 'bank';
					} else if (normalizedQuery.includes('atm')) {
						dataType = 'atm';
					} else if (normalizedQuery.includes('cctv') || normalizedQuery.includes('camera')) {
						dataType = 'cctv';
					} else if (normalizedQuery.includes('accident')) {
						dataType = 'accident';
					} else if (normalizedQuery.includes('dial') || normalizedQuery.includes('112') || normalizedQuery.includes('emergency')) {
						dataType = 'dial112';
					} else if (normalizedQuery.includes('crime') || normalizedQuery.includes('fir')) {
						dataType = 'crime';
					}

					console.log(`🔍 Area search: "${areaName}", type: ${dataType}`);

					// 1. Try KML Boundaries first (Offline/Fast)
					if (kmlFeatures) {
						const { findBoundaryByName } = await import("@/utils/geoUtils");
						targetBoundary = findBoundaryByName(areaName, kmlFeatures);
					}

					// 2. If no KML boundary, try Google Maps Geocoding (Online/Fallback)
					if (!targetBoundary && typeof window !== 'undefined' && window.google?.maps) {
						try {
							console.log(`🗺️ KML match failed. Trying Geocoding for: ${areaName}`);
							const geocoder = new window.google.maps.Geocoder();
							const { results } = await geocoder.geocode({
								address: `${areaName}, Nashik, Maharashtra`, // Append context
								componentRestrictions: { country: 'IN' }
							});

							if (results && results[0]) {
								const location = results[0].geometry.location;
								const lat = location.lat();
								const lng = location.lng();

								console.log(`📍 Geocoded "${areaName}" to ${lat}, ${lng}`);

								// Create a synthetic boundary/center point for radius search
								// We'll mark this as a "point" type feature so we know to use radius
								targetBoundary = {
									name: results[0].formatted_address || areaName,
									type: "point", // Custom type for point-based search
									coordinates: [{ lat, lng }], // Center point
									properties: {
										radius: "15000" // 15km radius in meters (increased for rural coverage)
									}
								};
							}
						} catch (err) {
							console.error("❌ Geocoding failed:", err);
						}
					}

					if (targetBoundary) {
						console.log(`✅ Search Target: ${targetBoundary.name} (Type: ${targetBoundary.type})`);
					} else {
						console.log(`⚠️ No location found for: ${areaName}`);
						areaSearchMode = false; // Fallback to string match
					}

					break;
				}
			}

			try {
				let mapDataPoints: MapDataPoint[] = [];
				let crimeDataPoints: any[] = [];
				let hospitalsList: Hospital[] = [];
				let atmsList: ATMLocation[] = [];
				let banksList: BankLocation[] = [];

				// Parallel fetch / retrieval
				// Use Promise.allSettled or just catch individual promises to prevent one failure from stopping all
				const [mapDataRes, hospitalsRes, atmsRes, banksRes] = await Promise.all([
					// Always fetch full map data to ensure we search everything
					fetchMapData().catch(() => ({ success: false, data_points: [], crime_data: [] })),
					hospitalLocations.length > 0 ? Promise.resolve(hospitalLocations) : fetchHospitals().catch(() => []),
					atmLocations.length > 0 ? Promise.resolve(atmLocations) : fetchATMLocations().catch(() => []),
					bankLocations.length > 0 ? Promise.resolve(bankLocations) : fetchBankLocations().catch(() => []),
				]);

				mapDataPoints = mapDataRes.data_points || [];
				crimeDataPoints = mapDataRes.crime_data || [];
				hospitalsList = hospitalsRes as Hospital[];
				atmsList = atmsRes as ATMLocation[];
				banksList = banksRes as BankLocation[];

				// Update states if they were empty - just for the specific layers we know
				if (policeLocations.length === 0) {
					const police = mapDataPoints.filter((item) => item.category_name === "पोलीस आस्थापना");
					if (police.length > 0) setPoliceLocations(police);
				}
				if (hospitalLocations.length === 0 && hospitalsList.length > 0) setHospitalLocations(hospitalsList);
				if (atmLocations.length === 0 && atmsList.length > 0) setAtmLocations(atmsList);
				if (bankLocations.length === 0 && banksList.length > 0) setBankLocations(banksList);

				const results: Array<{ id: string | number; title: string; subtitle?: string; type: string; position: { lat: number; lng: number } }> = [];

				// === AREA-BASED FILTERING ===
				if (areaSearchMode && targetBoundary) {
					const { filterPointsInBoundary, calculateDistance } = await import("@/utils/geoUtils");

					// Helper to filter and add results for a specific data type
					const addFilteredResults = (
						items: unknown[],
						type: string,
						titleFn: (item: unknown) => string,
						subtitleFn?: (item: unknown) => string
					) => {
						const mappedItems = items.map((item: unknown) => {
							const i = item as Record<string, unknown>;
							return {
								...i,
								lat: typeof i.latitude === 'string' ? parseFloat(i.latitude as string) : i.latitude as number,
								lng: typeof i.longitude === 'string' ? parseFloat(i.longitude as string) : i.longitude as number,
							};
						});

						let filtered: typeof mappedItems = [];

						if (targetBoundary!.type === 'point' && targetBoundary!.properties?.radius) {
							// Radius Search (Geocoded Point)
							const center = targetBoundary!.coordinates[0];
							const radius = parseFloat(targetBoundary!.properties.radius);

							filtered = mappedItems.filter(item => {
								if (!item.lat || !item.lng) return false;
								const dist = calculateDistance(center, item);
								// console.log(`Debug Distance: ${dist}m for ${titleFn(item)}`); // Verbose logging
								return dist <= radius;
							});
							console.log(`📍 Radius Search: Found ${filtered.length} items within ${radius}m of ${center.lat},${center.lng}`);
						} else {
							// Polygon Search (KML Boundary)
							filtered = filterPointsInBoundary(mappedItems, targetBoundary!);
						}

						filtered.forEach((item: Record<string, unknown>) => {
							results.push({
								id: `${type.toLowerCase()}-${item.id || Math.random()}`,
								title: titleFn(item),
								subtitle: subtitleFn ? subtitleFn(item) : `${targetBoundary!.name}`,
								type,
								position: { lat: item.lat as number, lng: item.lng as number },
							});
						});

						return filtered.length;
					};

					// Filter based on detected data type
					if (dataType === 'police') {
						// 1. From dedicated/explicit map category
						const policeStations = mapDataPoints.filter(p =>
							p.category_name === "पोलीस आस्थापना" ||
							(p.name && (p.name.toLowerCase().includes("police") || p.name.includes("पोलीस")))
						);
						const count = addFilteredResults(
							policeStations,
							"Police Station",
							(item: unknown) => (item as MapDataPoint).name,
							(item: unknown) => (item as MapDataPoint).address
						);
						console.log(`🚔 Found ${count} police stations in ${targetBoundary.name}`);
					} else if (dataType === 'hospital') {
						// 1. From Hospitals API
						let count = addFilteredResults(
							hospitalsList,
							"Hospital",
							(item: unknown) => (item as Hospital).hospital_name || (item as Hospital).name,
							(item: unknown) => (item as Hospital).type
						);

						// 2. From Map Data (generic points that are hospitals)
						const mapHospitals = mapDataPoints.filter(p => {
							const name = (p.name || "").toLowerCase();
							const cat = (p.category_name || "").toLowerCase();
							return name.includes("hospital") || name.includes("medical") || name.includes("clinic") || name.includes("phc") || name.includes("rh") || cat.includes("hospital") || cat.includes("medical");
						});

						count += addFilteredResults(
							mapHospitals,
							"Hospital",
							(item: unknown) => (item as MapDataPoint).name,
							(item: unknown) => (item as MapDataPoint).address
						);

						console.log(`🏥 Found ${count} hospitals in ${targetBoundary.name}`);
					} else if (dataType === 'bank') {
						// 1. From Banks API
						let count = addFilteredResults(
							banksList,
							"Bank",
							(item: unknown) => `${(item as BankLocation).bank_name} - ${(item as BankLocation).branch_name}`,
							(item: unknown) => (item as BankLocation).address
						);

						// 2. From Map Data
						const mapBanks = mapDataPoints.filter(p => {
							const name = (p.name || "").toLowerCase();
							return (name.includes("bank") && !name.includes("embankment"));
						});

						count += addFilteredResults(
							mapBanks,
							"Bank",
							(item: unknown) => (item as MapDataPoint).name,
							(item: unknown) => (item as MapDataPoint).address
						);

						console.log(`🏦 Found ${count} banks in ${targetBoundary.name}`);
					} else if (dataType === 'atm') {
						// 1. From ATMs API
						let count = addFilteredResults(
							atmsList,
							"ATM",
							(item: unknown) => `${(item as ATMLocation).bank_name} ATM`,
							(item: unknown) => (item as ATMLocation).address
						);

						// 2. From Map Data
						const mapAtms = mapDataPoints.filter(p => {
							const name = (p.name || "").toLowerCase();
							return name.includes("atm");
						});

						count += addFilteredResults(
							mapAtms,
							"ATM",
							(item: unknown) => (item as MapDataPoint).name,
							(item: unknown) => (item as MapDataPoint).address
						);

						console.log(`🏧 Found ${count} ATMs in ${targetBoundary.name}`);
					} else if (dataType === 'accident') {
						let accidents = accidentAllRecords;
						if (accidents.length === 0) {
							try {
								const fetchedAccidents = await fetchAccidentRecords();
								accidents = fetchedAccidents;
								setAccidentAllRecords(fetchedAccidents);
							} catch (error) {
								console.error("Failed to fetch accidents:", error);
							}
						}

						const count = addFilteredResults(
							accidents,
							"Accident",
							(item: unknown) => `Accident in ${(item as AccidentRecord).district}`,
							(item: unknown) => `Grid: ${(item as AccidentRecord).gridId}`
						);
						console.log(`🚗 Found ${count} accidents in ${targetBoundary.name}`);
					} else if (dataType === 'dial112') {
						let dial112Data = dial112AllCalls;
						if (dial112Data.length === 0) {
							try {
								const fetchedCalls = await fetchDial112Calls();
								dial112Data = fetchedCalls;
								setDial112AllCalls(fetchedCalls);
							} catch (error) {
								console.error("Failed to fetch dial 112 calls:", error);
							}
						}

						const count = addFilteredResults(
							dial112Data,
							"Dial 112 Call",
							(item: unknown) => `Call: ${(item as Dial112Call).callType || 'Unknown'}`,
							(item: unknown) => new Date((item as Dial112Call).receivedAt).toLocaleDateString()
						);
						console.log(`🚨 Found ${count} dial 112 calls in ${targetBoundary.name}`);
					} else if (dataType === 'cctv') {
						const cctvList = cctvLocations.length > 0 ? cctvLocations : await fetchCCTVLocations().catch(() => []);
						const count = addFilteredResults(
							cctvList,
							"CCTV",
							(item: unknown) => (item as CCTVLocation).name,
							(item: unknown) => (item as CCTVLocation).location_name
						);
						console.log(`🎥 Found ${count} CCTV cameras in ${targetBoundary.name}`);
					} else if (dataType === 'crime') {
						// 1. From dedicated Crime Data (if available logic exists)
						// Ensure we have 'crime_data' from mapDataResponse

						let count = addFilteredResults(
							crimeDataPoints,
							"Crime",
							(item: unknown) => (item as any).crime_head || "Crime Incident",
							(item: unknown) => (item as any).police_station || "Reported"
						);

						// 2. From Map Data (with crime_number not null)
						const crimePoints = mapDataPoints.filter(p => !!p.crime_number);
						count += addFilteredResults(
							crimePoints,
							"Crime",
							(item: unknown) => (item as MapDataPoint).name || "Crime Location",
							(item: unknown) => (item as MapDataPoint).crime_number || "Reference ID"
						);

						console.log(`⚠️ Found ${count} crimes in ${targetBoundary.name}`);
					}

					// Add summary result regardless of count, to confirm we found the location
					if (targetBoundary) {
						results.unshift({
							id: 'area-summary',
							title: `📍 ${targetBoundary.name}`,
							subtitle: results.length > 0
								? `Found ${results.length} ${dataType || 'items'} in this area`
								: `No ${dataType || 'items'} found within ${targetBoundary.properties?.radius ? parseInt(targetBoundary.properties.radius) / 1000 + 'km' : 'this area'}`,
							type: "Area Summary",
							position: {
								lat: targetBoundary.coordinates[0]?.lat || 0,
								lng: targetBoundary.coordinates[0]?.lng || 0
							},
						});
					}

					setSearchResults(results);
					setIsSearching(false);
					return; // Skip normal search
				}

				// === NORMAL SEARCH (if not area-based) ===

				// 1. Search Officers
				officerList.forEach((officer) => {
					if (matches([officer.name, officer.sevrathId, officer.rank, "Officer", "Police"])) {
						results.push({
							id: officer.officerId,
							title: officer.name,
							subtitle: `${officer.rank} (${officer.sevrathId})`,
							type: "Officer",
							position: { lat: officer.location.latitude, lng: officer.location.longitude },
						});
					}
				});

				// 2. Search Map Data Points (includes Police Stations and others)
				mapDataPoints.forEach((p) => {
					// Map category names to English for better searchability
					let englishType = "Location";
					const lowerName = String(p.name || "").toLowerCase();
					const lowerCat = String(p.category_name || "").toLowerCase();

					// Intelligent type detection based on name overrides category
					if (lowerName.includes("atm")) {
						englishType = "ATM";
					} else if (lowerName.includes("bank") && !lowerName.includes("embankment")) {
						englishType = "Bank";
					} else if (lowerName.includes("hospital") || lowerName.includes("clinic") || lowerName.includes("medical")) {
						englishType = "Hospital";
					} else if (p.category_name === "पोलीस आस्थापना" || lowerCat.includes("police")) {
						englishType = "Police Station";
					} else {
						englishType = p.category_name || "Location"; // Fallback
					}

					// Prepare fields to search against
					const searchFields = [
						p.name,
						p.address,
						p.description,
						p.category_name,
						englishType,
						// Add explicit keywords for matching
						englishType === "Police Station" ? "Police" : null
					];

					if (matches(searchFields)) {
						const lat = typeof p.latitude === "string" ? parseFloat(p.latitude) : p.latitude;
						const lng = typeof p.longitude === "string" ? parseFloat(p.longitude) : p.longitude;

						// Avoid duplicates if multiple datasets return same points (unlikely here but good practice)
						results.push({
							id: `map-${p.id}`,
							title: p.name,
							subtitle: p.address,
							type: englishType,
							position: { lat, lng },
						});
					}
				});

				// 3. Search Hospitals
				hospitalsList.forEach((h) => {
					if (matches([h.hospital_name, h.name, h.type, h.specialties, "Hospital", "Medical"])) {
						const lat = typeof h.latitude === "string" ? parseFloat(h.latitude) : h.latitude;
						const lng = typeof h.longitude === "string" ? parseFloat(h.longitude) : h.longitude;
						results.push({
							id: `hosp-${h.id}`,
							title: h.hospital_name || h.name,
							subtitle: h.type,
							type: "Hospital",
							position: { lat, lng },
						});
					}
				});

				// 4. Search Banks
				banksList.forEach((b) => {
					if (matches([b.bank_name, b.branch_name, b.address, "Bank"])) {
						const lat = typeof b.latitude === "string" ? parseFloat(b.latitude) : b.latitude;
						const lng = typeof b.longitude === "string" ? parseFloat(b.longitude) : b.longitude;
						results.push({
							id: `bank-${b.id}`,
							title: `${b.bank_name} - ${b.branch_name}`,
							type: "Bank",
							position: { lat, lng },
						});
					}
				});

				// 5. Search ATMs
				atmsList.forEach((a) => {
					if (matches([a.bank_name, a.address, "ATM"])) {
						const lat = typeof a.latitude === "string" ? parseFloat(a.latitude) : a.latitude;
						const lng = typeof a.longitude === "string" ? parseFloat(a.longitude) : a.longitude;
						results.push({
							id: `atm-${a.id}`,
							title: `${a.bank_name} ATM`,
							subtitle: a.address,
							type: "ATM",
							position: { lat, lng },
						});
					}
				});

				// 6. Search Accidents
				let accidents = accidentAllRecords;
				if (accidents.length === 0 && (normalizedQuery.includes("accident") || normalizedQuery.includes("district"))) {
					try {
						const fetchedAccidents = await fetchAccidentRecords();
						accidents = fetchedAccidents;
						setAccidentAllRecords(fetchedAccidents);
					} catch (error) {
						console.error("Failed to fetch accidents (search):", error);
					}
				}

				accidents.forEach((a) => {
					if (matches([String(a.accidentCount), a.district, a.gridId, "Accident"])) {
						results.push({
							id: `acc-${a.gridId}-${Math.random()}`,
							title: `Accident Spot (${a.accidentCount} incidents)`,
							subtitle: `${a.district} (Grid: ${a.gridId})`,
							type: "Accident",
							position: { lat: a.latitude, lng: a.longitude },
						});
					}
				});

				// 7. Search Dial 112
				let dial112 = dial112AllCalls;
				if (dial112.length === 0 && (normalizedQuery.includes("112") || normalizedQuery.includes("dial") || normalizedQuery.includes("emergency"))) {
					try {
						const fetchedCalls = await fetchDial112Calls();
						dial112 = fetchedCalls;
						setDial112AllCalls(fetchedCalls);
					} catch (error) {
						console.error("Failed to fetch dial 112 (search):", error);
					}
				}

				dial112.forEach((call) => {
					if (matches([call.callType, call.policeStation, "Dial 112", "Emergency"])) {
						results.push({
							id: `dial112-${call.id}`,
							title: `Emergency Call: ${call.callType}`,
							subtitle: call.policeStation,
							type: "Dial 112",
							position: { lat: call.latitude, lng: call.longitude }, // Ensure these field names match your API response
						});
					}
				});

				// 8. Search Crimes
				// Search dedicated crime data
				crimeDataPoints.forEach((c: any) => {
					// Format should match user request: Show ID/Number prominently
					const crimeId = c.crime_number || c.fir_no || c.id;
					const title = c.crime_head || c.title || "Crime Incident";

					if (matches([title, c.police_station, crimeId, "Crime", "FIR"])) {
						const lat = typeof c.latitude === "string" ? parseFloat(c.latitude) : c.latitude;
						const lng = typeof c.longitude === "string" ? parseFloat(c.longitude) : c.longitude;

						if (lat && lng) {
							results.push({
								id: `crime-${c.id || Math.random()}`,
								title: `Crime #${crimeId} - ${title}`,
								subtitle: c.police_station || "Reported Location",
								type: "Crime",
								position: { lat, lng },
							});
						}
					}
				});

				// Search map data points that are flagged as crimes
				mapDataPoints.forEach((p) => {
					if (p.crime_number && matches([p.name, p.crime_number, "Crime", "FIR"])) {
						const lat = typeof p.latitude === "string" ? parseFloat(p.latitude) : p.latitude;
						const lng = typeof p.longitude === "string" ? parseFloat(p.longitude) : p.longitude;
						results.push({
							id: `crime-map-${p.id}`,
							title: `Crime #${p.crime_number}`,
							subtitle: p.name || p.address || "Crime Spot",
							type: "Crime",
							position: { lat, lng },
						});
					}
				});

				// Final deduplication by ID just in case
				const uniqueResults = Array.from(new Map(results.map(item => [item.id, item])).values());
				setSearchResults(uniqueResults.slice(0, 50));
			} catch (error) {
				console.error("Search failed:", error);
			} finally {
				setIsSearching(false);
			}
		},
		[policeLocations, hospitalLocations, atmLocations, bankLocations, officerList],
	);

	const handleSearchResultClick = (result: { position: { lat: number; lng: number }; title: string; type: string }) => {
		setSelectedPoint({ ...result.position, zoom: 18 });
		setClickedPoint({
			lat: result.position.lat,
			lng: result.position.lng,
			title: result.title,
			group: result.type,
		});
	};

	// Helpers
	const toRad = (deg: number) => (deg * Math.PI) / 180;
	const haversineMeters = (a: { lat: number; lng: number }, b: { lat: number; lng: number }): number => {
		const R = 6371000; // meters
		const dLat = toRad(b.lat - a.lat);
		const dLng = toRad(b.lng - a.lng);
		const lat1 = toRad(a.lat);
		const lat2 = toRad(b.lat);
		const sinDLat = Math.sin(dLat / 2);
		const sinDLng = Math.sin(dLng / 2);
		const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
		return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
	};

	const pointInPolygon = (point: { lat: number; lng: number }, polygon: { lat: number; lng: number }[]): boolean => {
		let inside = false;
		for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
			const xi = polygon[i].lng,
				yi = polygon[i].lat;
			const xj = polygon[j].lng,
				yj = polygon[j].lat;
			const intersect = yi > point.lat !== yj > point.lat && point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
			if (intersect) inside = !inside;
		}
		return inside;
	};

	const findVillageName = (start: { lat: number; lng: number }, end: { lat: number; lng: number }, features: KMLFeature[]): string | null => {
		for (const candidate of [start, end]) {
			const match = features.find((f) => f.type === "polygon" && pointInPolygon(candidate, f.coordinates));
			if (match) return match.name;
		}
		return null;
	};

	// Accepts API police stations or KML-derived markers mapped to station-like objects
	type StationLike = { name: string; latitude: number | string; longitude: number | string };
	const findNearestPoliceStation = (path: Array<{ lat: number; lng: number }>, stations: StationLike[]): { name: string; distanceMeters: number } | null => {
		if (stations.length === 0 || path.length === 0) return null;
		let best: { name: string; distanceMeters: number } | null = null;
		// Sample along path to limit cost
		const step = Math.max(1, Math.floor(path.length / 100));
		for (let i = 0; i < path.length; i += step) {
			const p = path[i];
			for (const st of stations) {
				const stationPos = {
					lat: typeof st.latitude === "string" ? parseFloat(st.latitude) : (st.latitude as number),
					lng: typeof st.longitude === "string" ? parseFloat(st.longitude) : (st.longitude as number),
				};
				const d = haversineMeters(p, stationPos);
				if (!best || d < best.distanceMeters) {
					best = { name: st.name, distanceMeters: d };
				}
			}
		}
		return best;
	};

	const formatDateTime = (value?: string | Date | null) => {
		if (!value) return "—";
		const date = typeof value === "string" ? new Date(value) : value;
		if (Number.isNaN(date.getTime())) return "—";
		return date.toLocaleString();
	};

	const focusOfficer = useCallback(
		(officer: OfficerDutyLocation, options?: { pan?: boolean; updateStreetView?: boolean }) => {
			// Only allow focusing if panel is active
			if (!officerPanelActive) return;

			setSelectedOfficer(officer);
			if (options?.updateStreetView !== false) {
				setClickedPoint({
					lat: officer.location.latitude,
					lng: officer.location.longitude,
					title: officer.name,
					group: "Duty Officers",
					meta: { officerId: officer.officerId },
				});
			}
			if (options?.pan !== false) {
				setSelectedPoint({ lat: officer.location.latitude, lng: officer.location.longitude, zoom: 17 });
			}
		},
		[officerPanelActive],
	);

	const fetchDutyOfficersRef = useRef<(() => Promise<void>) | null>(null);

	const fetchDutyOfficers = useCallback(async () => {
		setOfficerLoading(true);
		setOfficerError(null);
		try {
			const response = await getDutyOfficersLocations();
			const officersWithLocation = response.data.officers.filter((officer) => typeof officer?.location?.latitude === "number" && typeof officer?.location?.longitude === "number");
			setOfficerSummary(response.data);
			setOfficerList(officersWithLocation);
			setOfficerLastUpdated(new Date());

			if (selectedOfficer) {
				const latest = officersWithLocation.find((officer) => officer.officerId === selectedOfficer.officerId);
				if (latest) {
					setSelectedOfficer(latest);
					setClickedPoint({
						lat: latest.location.latitude,
						lng: latest.location.longitude,
						title: latest.name,
						group: "Duty Officers",
					});
				}
			}
		} catch (error) {
			setOfficerError(error instanceof Error ? error.message : "Unable to fetch officer locations");
		} finally {
			setOfficerLoading(false);
		}
	}, [focusOfficer, selectedOfficer]);

	// Store latest fetch function in ref
	useEffect(() => {
		fetchDutyOfficersRef.current = fetchDutyOfficers;
	}, [fetchDutyOfficers]);

	// Initial fetch
	useEffect(() => {
		fetchDutyOfficers();
	}, []);

	// Auto-refresh every 30s (only depends on toggle, uses ref for latest function)
	useEffect(() => {
		if (!officerAutoRefresh) return;
		const id = window.setInterval(() => {
			if (fetchDutyOfficersRef.current) {
				fetchDutyOfficersRef.current();
			}
		}, 30000);
		return () => window.clearInterval(id);
	}, [officerAutoRefresh]);

	const filteredOfficers = useMemo(() => {
		const query = officerSearch.trim().toLowerCase();
		if (!query) return officerList;
		return officerList.filter((officer) => {
			const haystack = `${officer.name} ${officer.sevrathId} ${officer.mobileNumber}`.toLowerCase();
			return haystack.includes(query);
		});
	}, [officerList, officerSearch]);

	const liveCount = officerSummary?.summary.withLiveLocation ?? officerList.filter((officer) => officer.location.source?.toLowerCase() === "live").length;
	const reportedCount = officerSummary?.summary.withReportedLocation ?? officerList.filter((officer) => officer.location.source?.toLowerCase() === "reported").length;
	const dutyCount = officerSummary?.summary.withDutyLocation ?? officerList.filter((officer) => officer.location.source?.toLowerCase().includes("duty")).length;
	const totalOfficerCount = officerSummary?.totalOfficers ?? officerList.length;

	// Load categories on mount
	useEffect(() => {
		const loadCategoriesData = async () => {
			if (categories.length === 0) {
				try {
					console.log("📂 Loading categories...");
					const data = await fetchCategories();
					setCategories(data);

					// Initialize toggles to false for all categories and subcategories
					const initialCategoryToggles: Record<number, boolean> = {};
					const initialSubcategoryToggles: Record<number, Record<number, boolean>> = {};

					data.forEach((category) => {
						initialCategoryToggles[category.id] = false;
						initialSubcategoryToggles[category.id] = {};
						category.subcategories.forEach((subcategory) => {
							initialSubcategoryToggles[category.id][subcategory.id] = false;
						});
					});

					setCategoryToggles(initialCategoryToggles);
					setSubcategoryToggles(initialSubcategoryToggles);
					console.log(`✅ Loaded ${data.length} categories`);
				} catch (error) {
					console.error("❌ Failed to load categories:", error);
				}
			}
		};

		loadCategoriesData();
	}, [categories.length]);

	// Load CCTV data when toggle is enabled
	useEffect(() => {
		const loadCCTVData = async () => {
			if (cctvLayerVisible && cctvLocations.length === 0 && !cctvLoading) {
				setCctvLoading(true);
				try {
					console.log("🎥 Loading CCTV data...");
					const data = await fetchCCTVLocations();
					setCctvLocations(data);
					console.log(`✅ Loaded ${data.length} CCTV locations`);
				} catch (error) {
					console.error("❌ Failed to load CCTV data:", error);
				} finally {
					setCctvLoading(false);
				}
			}
		};

		loadCCTVData();
	}, [cctvLayerVisible, cctvLocations.length, cctvLoading]);

	// Load ATM data when toggle is enabled
	useEffect(() => {
		const loadATMData = async () => {
			if (atmLayerVisible && atmLocations.length === 0 && !atmLoading) {
				setAtmLoading(true);
				try {
					console.log("🏧 Loading ATM data...");
					const data = await fetchATMLocations();
					setAtmLocations(data);
					console.log(`✅ Loaded ${data.length} ATM locations`);
				} catch (error) {
					console.error("❌ Failed to load ATM data:", error);
				} finally {
					setAtmLoading(false);
				}
			}
		};

		loadATMData();
	}, [atmLayerVisible, atmLocations.length, atmLoading]);

	// Load Bank data when toggle is enabled
	useEffect(() => {
		const loadBankData = async () => {
			if (bankLayerVisible && bankLocations.length === 0 && !bankLoading) {
				setBankLoading(true);
				try {
					console.log("🏦 Loading Bank data...");
					const data = await fetchBankLocations();
					setBankLocations(data);
					console.log(`✅ Loaded ${data.length} Bank locations`);
				} catch (error) {
					console.error("❌ Failed to load Bank data:", error);
				} finally {
					setBankLoading(false);
				}
			}
		};

		loadBankData();
	}, [bankLayerVisible, bankLocations.length, bankLoading]);

	// Load Hospital data when toggle is enabled
	useEffect(() => {
		const loadHospitalData = async () => {
			if (hospitalLayerVisible && hospitalLocations.length === 0 && !hospitalLoading) {
				setHospitalLoading(true);
				try {
					console.log("🏥 Loading Hospital data...");
					const data = await fetchHospitals();
					setHospitalLocations(data);
					console.log(`✅ Loaded ${data.length} Hospital locations`);
				} catch (error) {
					console.error("❌ Failed to load Hospital data:", error);
				} finally {
					setHospitalLoading(false);
				}
			}
		};

		loadHospitalData();
	}, [hospitalLayerVisible, hospitalLocations.length, hospitalLoading]);

	// Load Police Station data when toggle is enabled
	useEffect(() => {
		const loadPoliceData = async () => {
			if ((policeLayerVisible || areaLayerToggles.police) && policeLocations.length === 0 && !policeLoading) {
				setPoliceLoading(true);
				try {
					console.log("🚔 Loading Police Station data... [Trigger: Main or Area]", { main: policeLayerVisible, area: areaLayerToggles.police });
					const data = await fetchMapData();
					const policeStations = data.data_points.filter((item: MapDataPoint) => item.category_name === "पोलीस आस्थापना");
					setPoliceLocations(policeStations);
					console.log(`✅ Loaded ${policeStations.length} Police Station locations`);
				} catch (error) {
					console.error("❌ Failed to load Police Station data:", error);
				} finally {
					setPoliceLoading(false);
				}
			}
		};

		loadPoliceData();
	}, [policeLayerVisible, areaLayerToggles.police, policeLocations.length, policeLoading]);


	// Load Procession Routes data when any festival toggle is enabled
	useEffect(() => {
		const loadProcessionData = async () => {
			const hasVisibleFestivals = Object.values(processionsVisible).some((visible) => visible);

			if (hasVisibleFestivals && processionRoutes.length === 0 && !processionLoading) {
				setProcessionLoading(true);
				try {
					console.log("🛤️ Loading Procession Routes data...");
					const data = await fetchProcessionRoutes();
					setProcessionRoutes(data);
					console.log(`✅ Loaded ${data.length} Procession Routes`);
				} catch (error) {
					console.error("❌ Failed to load Procession Routes data:", error);
				} finally {
					setProcessionLoading(false);
				}
			}
		};

		loadProcessionData();
	}, [processionsVisible, processionRoutes.length, processionLoading]);

	// Load Dial 112 via SSE (cache all points, no rendering yet)
	useEffect(() => {
		let buffer: Dial112Call[] = [];
		let rafHandle: number | null = null;

		const flushBuffer = () => {
			if (buffer.length > 0) {
				setDial112AllCalls((prev) => {
					const updated = [...prev, ...buffer];
					console.log(`🚨 Dial 112 cache updated: ${updated.length} total calls`);
					return updated;
				});
				buffer = [];
			}
			rafHandle = null;
		};

		if ((dial112Visible || dial112HeatmapVisible || areaLayerToggles.dial112 || areaLayerToggles.dial112Heatmap) && !dial112LoadingRef.current) {
			console.log("🚨 Starting Dial 112 SSE stream subscription... [Trigger: Main or Area]", {
				main: dial112Visible || dial112HeatmapVisible,
				area: areaLayerToggles.dial112 || areaLayerToggles.dial112Heatmap
			});
			dial112LoadingRef.current = true;
			setDial112Loading(true);
			setDial112AllCalls([]);
			streamDial112Calls(
				(row) => {
					buffer.push(row);
					// Batch every 100 rows for caching
					if (buffer.length >= 100) {
						if (rafHandle !== null) cancelAnimationFrame(rafHandle);
						rafHandle = requestAnimationFrame(flushBuffer);
					}
				},
				() => {
					// Flush remaining on done
					if (rafHandle !== null) cancelAnimationFrame(rafHandle);
					flushBuffer();
					console.log("✅ Dial 112 SSE stream complete");
					setDial112Loading(false);
					dial112LoadingRef.current = false;
				},
			);
		}
		return () => {
			// Only cleanup animation frame, NOT the SSE connection
			if (rafHandle !== null) cancelAnimationFrame(rafHandle);
			// Let the SSE stream complete naturally
		};
	}, [dial112Visible, dial112HeatmapVisible, areaLayerToggles.dial112, areaLayerToggles.dial112Heatmap]);

	// Load Accident data via SSE (cache all points, no rendering yet)
	useEffect(() => {
		let buffer: AccidentRecord[] = [];
		let rafHandle: number | null = null;
		let accumulatedRecords: AccidentRecord[] = [];

		const flushBuffer = () => {
			if (buffer.length > 0) {
				console.log(`🚗 Flushing ${buffer.length} records to cache`);
				accumulatedRecords = [...accumulatedRecords, ...buffer];
				setAccidentAllRecords([...accumulatedRecords]);
				console.log(`🚗 Accident cache updated: ${accumulatedRecords.length} total records`);
				buffer = [];
			}
			rafHandle = null;
		};

		if ((accidentVisible || accidentHeatmapVisible || areaLayerToggles.accidents || areaLayerToggles.accidentsHeatmap) && !accidentLoadingRef.current) {
			console.log("🚗 Starting Accident Data SSE stream subscription... [Trigger: Main or Area]", {
				main: accidentVisible || accidentHeatmapVisible,
				area: areaLayerToggles.accidents || areaLayerToggles.accidentsHeatmap
			});
			accidentLoadingRef.current = true;
			setAccidentLoading(true);
			accumulatedRecords = [];
			setAccidentAllRecords([]);
			streamAccidentData(
				(row) => {
					// console.log("🚗 Received accident row:", row); // Sparse logging
					buffer.push(row);
					// Batch every 50 rows for caching (smaller batches for faster updates)
					if (buffer.length >= 50) {
						if (rafHandle !== null) cancelAnimationFrame(rafHandle);
						rafHandle = requestAnimationFrame(flushBuffer);
					}
				},
				() => {
					// Flush remaining on done
					if (rafHandle !== null) cancelAnimationFrame(rafHandle);
					flushBuffer();
					console.log("✅ Accident Data SSE stream complete");
					setAccidentLoading(false);
					accidentLoadingRef.current = false;
				},
			);
		}
		return () => {
			// Only cleanup animation frame, NOT the SSE connection
			if (rafHandle !== null) cancelAnimationFrame(rafHandle);
			// Let the SSE stream complete naturally
		};
	}, [accidentVisible, accidentHeatmapVisible, areaLayerToggles.accidents, areaLayerToggles.accidentsHeatmap]);

	// Filter Dial 112 by viewport bounds AND zoom level (decimation)
	useEffect(() => {
		if (!dial112Visible) {
			setDial112Calls([]);
			return;
		}

		if (!mapBounds) {
			console.log("⏳ Waiting for map bounds...");
			return;
		}

		if (dial112AllCalls.length === 0) {
			console.log("⏳ Waiting for Dial 112 data...");
			return;
		}

		const { north, south, east, west, zoom } = mapBounds;
		console.log(`🗺️ Map bounds (zoom ${zoom}):`, { north, south, east, west });

		// Zoom-based decimation strategy:
		// zoom < 10: Show 1 in 50 points (very zoomed out - state/country level)
		// zoom 10-11: Show 1 in 20 points (city level)
		// zoom 12-13: Show 1 in 10 points (district level)
		// zoom 14-15: Show 1 in 5 points (neighborhood level)
		// zoom >= 16: Show all points (street level)
		let skipFactor = 1;
		if (zoom < 10) skipFactor = 50;
		else if (zoom < 12) skipFactor = 20;
		else if (zoom < 14) skipFactor = 10;
		else if (zoom < 16) skipFactor = 5;

		const filtered = dial112AllCalls.filter((call, index) => {
			// First check if in viewport
			const inViewport = call.latitude >= south && call.latitude <= north && call.longitude >= west && call.longitude <= east;
			if (!inViewport) return false;

			// Then apply decimation based on zoom
			return index % skipFactor === 0;
		});

		console.log(`📍 Dial 112: ${filtered.length}/${dial112AllCalls.length} in viewport (zoom ${zoom}, skip factor ${skipFactor})`);
		setDial112Calls(filtered);
	}, [dial112Visible, mapBounds, dial112AllCalls]);

	// Filter Accident by viewport bounds AND zoom level (decimation)
	useEffect(() => {
		if (!accidentVisible) {
			setAccidentRecords([]);
			return;
		}

		if (!mapBounds) {
			console.log("⏳ Waiting for map bounds...");
			return;
		}

		if (accidentAllRecords.length === 0) {
			console.log("⏳ Waiting for Accident data...");
			return;
		}

		console.log(`🚗 Processing ${accidentAllRecords.length} accident records for viewport filtering`);
		console.log(`🚗 First few records:`, accidentAllRecords.slice(0, 3));

		const { north, south, east, west, zoom } = mapBounds;
		console.log(`🗺️ Map bounds (zoom ${zoom}):`, { north, south, east, west });

		// Zoom-based decimation strategy:
		// zoom < 10: Show 1 in 50 points (very zoomed out - state/country level)
		// zoom 10-11: Show 1 in 20 points (city level)
		// zoom 12-13: Show 1 in 10 points (district level)
		// zoom 14-15: Show 1 in 5 points (neighborhood level)
		// zoom >= 16: Show all points (street level)
		let skipFactor = 1;
		if (zoom < 10) skipFactor = 50;
		else if (zoom < 12) skipFactor = 20;
		else if (zoom < 14) skipFactor = 10;
		else if (zoom < 16) skipFactor = 5;

		const filtered = accidentAllRecords.filter((record, index) => {
			// First check if in viewport
			const inViewport = record.latitude >= south && record.latitude <= north && record.longitude >= west && record.longitude <= east;
			if (!inViewport) return false;

			// Then apply decimation based on zoom
			return index % skipFactor === 0;
		});

		console.log(`📍 Accident: ${filtered.length}/${accidentAllRecords.length} in viewport (zoom ${zoom}, skip factor ${skipFactor})`);
		setAccidentRecords(filtered);
	}, [accidentVisible, mapBounds, accidentAllRecords]);

	// Refs to track loading/data state without causing effect re-runs
	const categoryLoadingRef = useRef(categoryLoading);
	const categoryDataRef = useRef(categoryData);
	categoryLoadingRef.current = categoryLoading;
	categoryDataRef.current = categoryData;

	// Load category data when toggle is enabled (lazy loading)
	useEffect(() => {
		const loadCategoryData = async (categoryId: number) => {
			const isEnabled = categoryToggles[categoryId] || areaLayerToggles[categoryId];
			// Use refs to check current state without including in dependencies
			if (!isEnabled || categoryLoadingRef.current[categoryId] || categoryDataRef.current[categoryId]) {
				return;
			}

			setCategoryLoading((prev) => ({ ...prev, [categoryId]: true }));

			try {
				console.log(`📊 Loading data for category ${categoryId}...`);
				const data = await fetchCategoryPoints(categoryId);
				setCategoryData((prev) => ({ ...prev, [categoryId]: data }));
				console.log(`✅ Loaded ${data.length} data points for category ${categoryId}`);
			} catch (error) {
				console.error(`❌ Error loading category ${categoryId} data:`, error);
			} finally {
				setCategoryLoading((prev) => ({ ...prev, [categoryId]: false }));
			}
		};

		// Load data for all enabled categories
		categories.forEach((category) => {
			if (categoryToggles[category.id] || areaLayerToggles[category.id]) {
				loadCategoryData(category.id);
			}
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [categories, categoryToggles, areaLayerToggles]);

	// KML Layer configuration
	// Note: Google Maps KmlLayer requires absolute URLs, so we use window.location.origin
	const kmlLayerConfig = {
		url: kmlAbsoluteUrl,
		visible: kmlLayerVisible,
		preserveBounds: true,
		suppressInfoWindows: false,
	};

	// GeoJSON Layer configuration
	const geoJsonLayerConfig = {
		url: "/kml/nashik_gramin.geojson",
		visible: geoJsonLayerVisible,
		style: {
			strokeColor: "#FF0000",
			strokeOpacity: 0.8,
			strokeWeight: 2,
			fillColor: "#FF0000",
			fillOpacity: 0.35,
		},
	};

	// Marker groups - only real data sources
	const markerGroups = useMemo(
		() => {
			// Helper to filter points within selected boundary
			const filterByBoundary = <T extends { latitude?: number | string; lng?: number; lat?: number; longitude?: number | string }>(items: T[], dataName: string): T[] => {
				if (!selectedBoundary) return items;
				const filtered = items.filter(item => {
					const lat = typeof item.latitude === 'string' ? parseFloat(item.latitude) : (item.latitude ?? (item as any).lat);
					const lng = typeof item.longitude === 'string' ? parseFloat(item.longitude) : (item.longitude ?? (item as any).lng);
					if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) return false;
					return isPointInPolygon({ lat, lng }, selectedBoundary.coordinates);
				});
				console.log(`🔍 filterByBoundary [${dataName}]: ${items.length} → ${filtered.length} (boundary: ${selectedBoundary.name}, coords: ${selectedBoundary.coordinates.length} points)`);
				return filtered;
			};

			// Determine visibility - use area toggles if boundary selected, otherwise use normal toggles
			const isAreaMode = !!selectedBoundary;
			const getDial112Visibility = () => isAreaMode ? !!areaLayerToggles.dial112 : dial112Visible;
			const getAccidentVisibility = () => isAreaMode ? !!areaLayerToggles.accidents : accidentVisible;
			const getPoliceVisibility = () => isAreaMode ? !!areaLayerToggles.police : policeLayerVisible;
			const getHospitalVisibility = () => isAreaMode ? !!areaLayerToggles.hospitals : hospitalLayerVisible;
			const getAtmVisibility = () => isAreaMode ? !!areaLayerToggles.atms : atmLayerVisible;
			const getBankVisibility = () => isAreaMode ? !!areaLayerToggles.banks : bankLayerVisible;
			const getCctvVisibility = () => isAreaMode ? !!areaLayerToggles.cctv : cctvLayerVisible;

			// Debug: log area mode state
			if (isAreaMode) {
				console.log('📍 AREA MODE ACTIVE:', {
					boundaryName: selectedBoundary?.name,
					boundaryCoords: selectedBoundary?.coordinates?.length,
					areaLayerToggles,
					dial112AllCallsCount: dial112AllCalls.length,
					accidentAllRecordsCount: accidentAllRecords.length,
				});
			}

			// Filter data if in area mode - use ALL data sources to bypass viewport filtering
			const filteredDial112 = isAreaMode ? filterByBoundary(dial112AllCalls, 'dial112') : dial112Calls;
			const filteredAccidents = isAreaMode ? filterByBoundary(accidentAllRecords, 'accidents') : accidentRecords;
			const filteredPolice = isAreaMode ? filterByBoundary(policeLocations, 'police') : policeLocations;
			const filteredHospitals = isAreaMode ? filterByBoundary(hospitalLocations, 'hospitals') : hospitalLocations;
			const filteredAtms = isAreaMode ? filterByBoundary(atmLocations, 'atms') : atmLocations;
			const filteredBanks = isAreaMode ? filterByBoundary(bankLocations, 'banks') : bankLocations;
			const filteredCctv = isAreaMode ? filterByBoundary(cctvLocations, 'cctv') : cctvLocations;

			// Debug: log visibility states
			if (isAreaMode) {
				console.log('📊 AREA VISIBILITY:', {
					dial112: { visible: getDial112Visibility(), count: filteredDial112.length },
					accidents: { visible: getAccidentVisibility(), count: filteredAccidents.length },
					police: { visible: getPoliceVisibility(), count: filteredPolice.length },
				});
			}

			return [
				{
					name: "Duty Officers",
					color: "#22C55E",
					visible: officerPanelActive && !officerLoading && officerList.length > 0,
					markers:
						officerPanelActive && !officerLoading && officerList.length > 0
							? officerList.map((officer) => ({
								position: { lat: officer.location.latitude, lng: officer.location.longitude },
								title: officer.name,
								label: "👮",
								meta: { officerId: officer.officerId },
							}))
							: [],
				},
				{
					name: "Search Selection",
					color: "#FFFF00", // Yellow highlight
					visible: true,
					markers: clickedPoint ? [{
						position: { lat: clickedPoint.lat, lng: clickedPoint.lng },
						title: clickedPoint.title || "Selected Location",
						label: "📍"
					}] : []
				},
				{
					name: "Dial 112 Calls",
					color: "#EAB308", // Amber
					visible: getDial112Visibility(),
					markers: filteredDial112.map((c) => ({
						position: { lat: c.latitude, lng: c.longitude },
						title: c.eventId || c.policeStation || "Dial 112 Call",
						label: "112",
					})),
				},
				// Real CCTV data from external API
				{
					name: "CCTV Cameras",
					color: "#F97316", // Orange
					visible: getCctvVisibility(),
					markers: filteredCctv.map((cctv) => ({
						position: {
							lat: typeof cctv.latitude === "string" ? parseFloat(cctv.latitude) : cctv.latitude,
							lng: typeof cctv.longitude === "string" ? parseFloat(cctv.longitude) : cctv.longitude,
						},
						title: cctv.name || cctv.location_name || `CCTV ${cctv.id}`,
						label: cctv.is_working ? "🎥" : "📷",
						extraData: {
							address: cctv.address,
							cameraType: cctv.camera_type,
							isWorking: cctv.is_working,
							ward: cctv.ward,
							installationDate: cctv.installation_date,
						},
					})),
				},
				// ATM Locations
				{
					name: "ATM Locations",
					color: "#86EFAC", // Light green
					visible: getAtmVisibility(),
					markers: filteredAtms.map((atm) => ({
						position: {
							lat: typeof atm.latitude === "string" ? parseFloat(atm.latitude) : atm.latitude,
							lng: typeof atm.longitude === "string" ? parseFloat(atm.longitude) : atm.longitude,
						},
						title: atm.name || atm.bank_name || `ATM ${atm.id}`,
						label: "🏧",
						extraData: {
							bankName: atm.bank_name,
							address: atm.address,
							isWorking: atm.is_working,
							ward: atm.ward,
						},
					})),
				},
				// Bank Branches
				{
					name: "Bank Branches",
					color: "#16A34A", // Dark green
					visible: getBankVisibility(),
					markers: filteredBanks.map((bank) => ({
						position: {
							lat: typeof bank.latitude === "string" ? parseFloat(bank.latitude) : bank.latitude,
							lng: typeof bank.longitude === "string" ? parseFloat(bank.longitude) : bank.longitude,
						},
						title: bank.name || bank.bank_name || `Bank ${bank.id}`,
						label: "🏦",
						extraData: {
							bankName: bank.bank_name,
							branchName: bank.branch_name,
							address: bank.address,
							ifscCode: bank.ifsc_code,
							contactNumber: bank.contact_number,
							isActive: bank.is_active,
							ward: bank.ward,
						},
					})),
				},
				// Hospitals
				{
					name: "Hospitals",
					color: "#FFFFFF", // White
					visible: getHospitalVisibility(),
					markers: filteredHospitals.map((hospital) => ({
						position: {
							lat: typeof hospital.latitude === "string" ? parseFloat(hospital.latitude) : hospital.latitude,
							lng: typeof hospital.longitude === "string" ? parseFloat(hospital.longitude) : hospital.longitude,
						},
						title: hospital.name || hospital.hospital_name || `Hospital ${hospital.id}`,
						label: "🏥",
						extraData: {
							hospitalName: hospital.hospital_name,
							address: hospital.address,
							contactNumber: hospital.contact_number,
							phone: hospital.phone,
							type: hospital.type,
							specialties: hospital.specialties,
							isActive: hospital.is_active,
							ward: hospital.ward,
						},
					})),
				},
				// Police Stations
				{
					name: "Police Stations",
					color: "#3B82F6", // Blue
					visible: getPoliceVisibility(),
					markers: filteredPolice.map((police) => ({
						position: {
							lat: typeof police.latitude === "string" ? parseFloat(police.latitude) : police.latitude,
							lng: typeof police.longitude === "string" ? parseFloat(police.longitude) : police.longitude,
						},
						title: police.name || `Police Station ${police.id}`,
						label: "🚔",
						extraData: {
							policeName: police.name,
							address: police.address,
							description: police.description,
							status: police.status,
							verifiedBy: police.verified_by,
							verifiedAt: police.verified_at,
							imageUrl: police.image_url,
							userName: police.user_name,
							categoryName: police.category_name,
							categoryColor: police.category_color,
						},
					})),
				},
				// Accident data from CSV
				{
					name: "Accident Records",
					color: "#EF4444", // Red
					visible: getAccidentVisibility(),
					markers: (() => {
						console.log(`🚗 Creating ${filteredAccidents.length} accident markers`);
						return filteredAccidents.map((accident) => {
							console.log("🚗 Creating accident marker:", accident);
							return {
								position: { lat: accident.latitude, lng: accident.longitude },
								title: `Accident ${accident.srNo} - ${accident.accidentCount} accidents`,
								label: "🚗",
								extraData: {
									state: accident.state,
									district: accident.district,
									accidentCount: accident.accidentCount,
									allIndiaRank: accident.allIndiaRank,
									gridId: accident.gridId,
									ambulance: accident.ambulance,
								},
							};
						});
					})(),
				},
				// Dynamic categories from API
				...categories
					.filter((category) => {
						// In area mode, use area toggles. Otherwise use normal category toggles.
						return isAreaMode ? areaLayerToggles[category.id] : categoryToggles[category.id];
					})
					.map((category) => {
						const points = categoryData[category.id] || [];
						// Filter by boundary if in area mode
						const areaPoints = isAreaMode ? filterByBoundary(points, category.name) : points;

						// Filter by active subcategories if any are enabled
						const activeSubcats = Object.entries(subcategoryToggles[category.id] || {})
							.filter(([, enabled]) => enabled)
							.map(([subcatId]) => parseInt(subcatId));

						let filteredPoints = areaPoints;
						if (activeSubcats.length > 0) {
							filteredPoints = areaPoints.filter((point) => activeSubcats.includes(point.subcategory_id));
						}

						// Apply viewport filtering and zoom-based decimation
						if (mapBounds) {
							const { north, south, east, west, zoom } = mapBounds;
							let skipFactor = 1;
							if (zoom < 10) skipFactor = 50;
							else if (zoom < 12) skipFactor = 20;
							else if (zoom < 14) skipFactor = 10;
							else if (zoom < 16) skipFactor = 5;

							// First filter by viewport (only if not already filtered by boundary)
							if (!isAreaMode) {
								filteredPoints = filteredPoints.filter((point) => {
									const lat = typeof point.latitude === "string" ? parseFloat(point.latitude) : parseFloat(String(point.latitude));
									const lng = typeof point.longitude === "string" ? parseFloat(point.longitude) : parseFloat(String(point.longitude));
									return lat >= south && lat <= north && lng >= west && lng <= east;
								});

								// Then apply decimation by zoom (only in non-area mode)
								filteredPoints = filteredPoints.filter((_, index) => index % skipFactor === 0);
							}
						}

						return {
							name: category.name,
							color: category.color || "#888888",
							visible: true,
							markers: filteredPoints.map((point) => ({
								position: {
									lat: typeof point.latitude === "string" ? parseFloat(point.latitude) : parseFloat(String(point.latitude)),
									lng: typeof point.longitude === "string" ? parseFloat(point.longitude) : parseFloat(String(point.longitude)),
								},
								title: point.name,
								label: category.icon,
								extraData: {
									description: point.description,
									address: point.address,
									categoryName: point.category_name,
									categoryColor: point.category_color,
									status: point.status,
									createdAt: point.created_at,
								},
							})),
						};
					}),
			]
		},
		[
			officerPanelActive,
			officerLoading,
			officerList,
			dial112Visible,
			dial112Calls,
			dial112AllCalls,
			cctvLayerVisible,
			cctvLocations,
			atmLayerVisible,
			atmLocations,
			bankLayerVisible,
			bankLocations,
			hospitalLayerVisible,
			hospitalLocations,
			policeLayerVisible,
			policeLocations,
			accidentVisible,
			accidentRecords,
			accidentAllRecords,
			categories,
			categoryToggles,
			subcategoryToggles,
			categoryData,
			mapBounds,
			selectedBoundary,
			areaLayerToggles,
			clickedPoint,
		],
	);

	// Festival color palette
	const festivalColors = [
		"#EF4444", // red
		"#F97316", // orange
		"#EAB308", // amber
		"#22C55E", // green
		"#3B82F6", // blue
		"#8B5CF6", // purple
		"#EC4899", // pink
		"#06B6D4", // cyan
		"#84CC16", // lime
		"#F59E0B", // yellow
	];

	// Generate color for festival (consistent hash-based)
	const getFestivalColor = (festivalName: string) => {
		let hash = 0;
		for (let i = 0; i < festivalName.length; i++) {
			hash = festivalName.charCodeAt(i) + ((hash << 5) - hash);
		}
		return festivalColors[Math.abs(hash) % festivalColors.length];
	};

	// Process procession routes for rendering
	const processProcessionRoutes = () => {
		const groupedRoutes = processionRoutes.reduce((acc, route) => {
			if (!acc[route.festival_name]) {
				acc[route.festival_name] = [];
			}
			acc[route.festival_name].push(route);
			return acc;
		}, {} as { [festivalName: string]: ProcessionRoute[] });

		return Object.entries(groupedRoutes).map(([festivalName, routes]) => {
			const color = getFestivalColor(festivalName);
			return {
				festivalName,
				color,
				visible: processionsVisible[festivalName] || false,
				routes: routes
					.map((route) => {
						try {
							const coordinates = JSON.parse(route.route_coordinates);
							return {
								id: route.id,
								path: coordinates.map((coord: { latitude: string; longitude: string }) => ({
									lat: parseFloat(coord.latitude),
									lng: parseFloat(coord.longitude),
								})),
								startPoint: {
									lat: parseFloat(route.start_point_lat),
									lng: parseFloat(route.start_point_lng),
								},
								endPoint: {
									lat: parseFloat(route.end_point_lat),
									lng: parseFloat(route.end_point_lng),
								},
								festival_name: route.festival_name,
								procession_number: route.procession_number,
								start_address: route.start_address,
								end_address: route.end_address,
								total_distance: route.total_distance,
								description: route.description,
							};
						} catch (error) {
							console.error(`Failed to parse route coordinates for route ${route.id}:`, error);
							return null;
						}
					})
					.filter((route): route is NonNullable<typeof route> => route !== null),
			};
		});
	};

	const processedProcessionRoutes = processProcessionRoutes();

	const getOfficerStatusStyles = (officer: OfficerDutyLocation) => {
		const source = officer.location.source?.toLowerCase();
		if (source === "live") {
			return { label: "LIVE", chip: "bg-green-500/20 text-green-300 border-green-500/40" };
		}
		if (source === "reported") {
			return { label: "REPORTED", chip: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" };
		}
		return { label: "DUTY POINT", chip: "bg-pink-500/20 text-pink-200 border-pink-500/30" };
	};

	const officerLegendItems = [
		{ label: "Live Attendance (Real-time)", description: "Device GPS signal", color: "bg-green-400" },
		{ label: "Reported Location", description: "Manual check-in", color: "bg-cyan-400" },
		{ label: "Assigned Duty Point", description: "Planned deployment", color: "bg-pink-400" },
	];

	const officerCards = [
		{
			title: "Total Officers",
			value: officerLoading ? "—" : totalOfficerCount,
			grad: "from-indigo-500/40 via-indigo-500/10 to-transparent",
			shadow: "shadow-indigo-500/30",
		},
		{
			title: "Live Location",
			value: officerLoading ? "—" : liveCount,
			grad: "from-emerald-500/40 via-emerald-500/10 to-transparent",
			shadow: "shadow-emerald-500/30",
		},
		{
			title: "Reported",
			value: officerLoading ? "—" : reportedCount,
			grad: "from-cyan-500/40 via-cyan-500/10 to-transparent",
			shadow: "shadow-cyan-500/30",
		},
		{
			title: "Duty Point",
			value: officerLoading ? "—" : dutyCount,
			grad: "from-pink-500/40 via-pink-500/10 to-transparent",
			shadow: "shadow-pink-500/30",
		},
	];

	const officerTrackingContent = (
		<div className="flex h-full flex-col space-y-4">
			<div className="grid grid-cols-2 gap-3">
				{officerCards.map((card) => (
					<div
						key={card.title}
						className={`rounded-2xl border border-white/5 bg-linear-to-br ${card.grad} p-4 text-white ${card.shadow}`}
					>
						<div className="text-xs uppercase tracking-wide text-white/70">{card.title}</div>
						<div className="mt-2 text-3xl font-semibold">{card.value}</div>
					</div>
				))}
			</div>

			<div className="space-y-4 rounded-2xl border border-white/5 bg-white/5 p-4">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm font-semibold text-white">Marker Legend</p>
						<p className="text-xs text-gray-400">Map + Street View context</p>
					</div>
				</div>
				<div className="space-y-2">
					{officerLegendItems.map((item) => (
						<div
							key={item.label}
							className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2 text-xs text-gray-300"
						>
							<div>
								<div className="font-medium text-white">{item.label}</div>
								<div className="text-[11px] text-gray-400">{item.description}</div>
							</div>
							<div className={`h-3 w-3 rounded-full ${item.color}`} />
						</div>
					))}
				</div>
				<div className="flex items-center justify-between text-sm text-gray-300">
					<span>Auto-refresh (30s)</span>
					<SliderV1
						checked={officerAutoRefresh}
						onChange={setOfficerAutoRefresh}
						id="officer-auto-refresh"
					/>
				</div>
				<div className="text-xs text-gray-500">Last updated: {officerLastUpdated ? formatDateTime(officerLastUpdated) : "Waiting for refresh"}</div>
			</div>

			<div className="space-y-3">
				<div className="relative">
					<svg
						className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z"
						/>
					</svg>
					<input
						type="text"
						value={officerSearch}
						onChange={(event) => setOfficerSearch(event.target.value)}
						placeholder="Search officer by name or Sevarth ID..."
						className="w-full rounded-xl border border-white/10 bg-black/30 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-white/30 focus:outline-none"
					/>
				</div>
				<button
					onClick={fetchDutyOfficers}
					disabled={officerLoading}
					className="flex w-full items-center justify-center space-x-2 rounded-xl border border-indigo-500/40 bg-indigo-500/10 py-2 text-sm font-medium text-white transition hover:border-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{officerLoading ? (
						<>
							<div className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
							<span>Refreshing...</span>
						</>
					) : (
						<>
							<span>Refresh Data</span>
							<span className="text-xs text-gray-400">(full sync)</span>
						</>
					)}
				</button>
				{officerError && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">{officerError}</div>}
			</div>

			<div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
				{officerLoading ? (
					<div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-black/20 p-8 text-center">
						<div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
						<div className="text-sm font-medium text-gray-300">Loading live officers...</div>
						<div className="mt-1 text-xs text-gray-500">Fetching location data</div>
					</div>
				) : filteredOfficers.length === 0 ? (
					<div className="rounded-2xl border border-white/5 bg-black/20 p-6 text-center text-sm text-gray-400">No officers found for your search.</div>
				) : (
					filteredOfficers.map((officer) => {
						const status = getOfficerStatusStyles(officer);
						const isActive = selectedOfficer?.officerId === officer.officerId;
						return (
							<button
								key={officer.officerId}
								onClick={() => {
									if (officerPanelActive) {
										focusOfficer(officer);
									}
								}}
								disabled={!officerPanelActive}
								className={`w-full rounded-2xl border p-3 text-left transition ${isActive ? "border-emerald-400/60 bg-emerald-500/10" : "border-white/5 bg-black/20 hover:border-white/20"
									}`}
							>
								<div className="flex items-start justify-between">
									<div>
										<div className="text-sm font-semibold text-white">{officer.name}</div>
										<div className="text-xs text-gray-400">{officer.rank}</div>
									</div>
									<span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${status.chip}`}>{status.label}</span>
								</div>
								<div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-400">
									<div>
										<div className="text-[10px] uppercase tracking-wide text-gray-500">Sevarth ID</div>
										<div className="font-mono text-white">{officer.sevrathId}</div>
									</div>
									<div>
										<div className="text-[10px] uppercase tracking-wide text-gray-500">Mobile</div>
										<div>{officer.mobileNumber}</div>
									</div>
									<div>
										<div className="text-[10px] uppercase tracking-wide text-gray-500">Event</div>
										<div className="text-white">{officer.eventName || "—"}</div>
									</div>
									<div>
										<div className="text-[10px] uppercase tracking-wide text-gray-500">Point</div>
										<div className="text-white">{officer.pointName || "—"}</div>
									</div>
								</div>
								<div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
									<span>Updated: {formatDateTime(officer.location.lastUpdated)}</span>
									<span>
										{officer.location.latitude.toFixed(4)}, {officer.location.longitude.toFixed(4)}
									</span>
								</div>
							</button>
						);
					})
				)}
			</div>
		</div>
	);

	// Helper to determine active mode for heatmaps
	const isHeatmapAreaMode = !!selectedBoundary;

	// Helper to filter data for heatmaps when in Area Mode
	const filterForHeatmap = <T extends { latitude: number | string; longitude: number | string }>(data: T[], type: string) => {
		if (!isHeatmapAreaMode || !selectedBoundary) return data;

		const filtered = data.filter(item => {
			const lat = typeof item.latitude === 'string' ? parseFloat(item.latitude) : (item.latitude as number);
			const lng = typeof item.longitude === 'string' ? parseFloat(item.longitude) : (item.longitude as number);
			if (isNaN(lat) || isNaN(lng)) return false;
			return isPointInPolygon({ lat, lng }, selectedBoundary.coordinates);
		});

		console.log(`🔥 Heatmap Filter [${type}]: ${data.length} → ${filtered.length} (Area Mode: ${selectedBoundary.name})`);
		return filtered;
	};

	// Prepare data sources
	const dial112HeatmapSource = isHeatmapAreaMode ? filterForHeatmap(dial112AllCalls, 'dial112') : dial112AllCalls;
	const accidentHeatmapSource = isHeatmapAreaMode ? filterForHeatmap(accidentAllRecords, 'accidents') : accidentAllRecords;

	// Dial 112 heatmap data
	const dial112HeatmapData = {
		data: dial112HeatmapSource.map((call) => ({
			position: { lat: call.latitude, lng: call.longitude },
			weight: 1,
		})),
		visible: isHeatmapAreaMode ? !!areaLayerToggles.dial112Heatmap : dial112HeatmapVisible,
		radius: 20,
		opacity: 0.6,
		gradient: [
			"rgba(234, 179, 8, 0)", // amber transparent
			"rgba(234, 179, 8, 0.4)",
			"rgba(251, 191, 36, 0.6)",
			"rgba(245, 158, 11, 0.8)",
			"rgba(217, 119, 6, 1)",
			"rgba(180, 83, 9, 1)",
		],
	};

	// Accident heatmap data
	const accidentHeatmapData = {
		data: accidentHeatmapSource.map((record) => ({
			position: { lat: record.latitude, lng: record.longitude },
			weight: record.accidentCount || 1,
		})),
		visible: isHeatmapAreaMode ? !!areaLayerToggles.accidentsHeatmap : accidentHeatmapVisible,
		radius: 20,
		opacity: 0.6,
		gradient: [
			"rgba(239, 68, 68, 0)", // red transparent
			"rgba(239, 68, 68, 0.4)",
			"rgba(220, 38, 38, 0.6)",
			"rgba(185, 28, 28, 0.8)",
			"rgba(153, 27, 27, 1)",
			"rgba(127, 29, 29, 1)",
		],
	};

	// ATM heatmap data
	const atmHeatmapData = {
		data: atmLocations.map((atm) => ({
			position: {
				lat: typeof atm.latitude === "string" ? parseFloat(atm.latitude) : atm.latitude,
				lng: typeof atm.longitude === "string" ? parseFloat(atm.longitude) : atm.longitude,
			},
			weight: 1,
		})),
		visible: atmHeatmapVisible,
		radius: 20,
		opacity: 0.6,
		gradient: [
			"rgba(134, 239, 172, 0)", // light green transparent
			"rgba(134, 239, 172, 0.4)",
			"rgba(74, 222, 128, 0.6)",
			"rgba(34, 197, 94, 0.8)",
			"rgba(22, 163, 74, 1)",
		],
	};

	// Bank heatmap data
	const bankHeatmapData = {
		data: bankLocations.map((bank) => ({
			position: {
				lat: typeof bank.latitude === "string" ? parseFloat(bank.latitude) : bank.latitude,
				lng: typeof bank.longitude === "string" ? parseFloat(bank.longitude) : bank.longitude,
			},
			weight: 1,
		})),
		visible: bankHeatmapVisible,
		radius: 20,
		opacity: 0.6,
		gradient: [
			"rgba(22, 163, 74, 0)", // dark green transparent
			"rgba(22, 163, 74, 0.4)",
			"rgba(21, 128, 61, 0.6)",
			"rgba(20, 83, 45, 0.8)",
			"rgba(15, 46, 28, 1)",
		],
	};

	// Hospital heatmap data
	const hospitalHeatmapData = {
		data: hospitalLocations.map((hospital) => ({
			position: {
				lat: typeof hospital.latitude === "string" ? parseFloat(hospital.latitude) : hospital.latitude,
				lng: typeof hospital.longitude === "string" ? parseFloat(hospital.longitude) : hospital.longitude,
			},
			weight: 1,
		})),
		visible: hospitalHeatmapVisible,
		radius: 20,
		opacity: 0.6,
		gradient: [
			"rgba(255, 255, 255, 0)", // white transparent
			"rgba(255, 255, 255, 0.4)",
			"rgba(219, 234, 254, 0.6)",
			"rgba(147, 197, 253, 0.8)",
			"rgba(59, 130, 246, 1)",
		],
	};

	// Police Station heatmap data
	const policeHeatmapData = {
		data: policeLocations.map((police) => ({
			position: {
				lat: typeof police.latitude === "string" ? parseFloat(police.latitude) : police.latitude,
				lng: typeof police.longitude === "string" ? parseFloat(police.longitude) : police.longitude,
			},
			weight: 1,
		})),
		visible: policeHeatmapVisible,
		radius: 20,
		opacity: 0.6,
		gradient: [
			"rgba(59, 130, 246, 0)", // blue transparent
			"rgba(59, 130, 246, 0.4)",
			"rgba(37, 99, 235, 0.6)",
			"rgba(29, 78, 216, 0.8)",
			"rgba(30, 64, 175, 1)",
		],
	};

	// Create searchable points from all markers
	const createSearchablePoints = () => {
		const points: Array<{
			id: string;
			position: { lat: number; lng: number };
			title: string;
			description?: string;
			tags?: string[];
			group?: string;
		}> = [];

		markerGroups.forEach((group) => {
			group.markers.forEach((marker, index) => {
				points.push({
					id: `${group.name.toLowerCase()}-${index}`,
					position: marker.position,
					title: marker.title || `${group.name} ${index + 1}`,
					description: `${group.name} location in Nashik Gramin`,
					tags: [group.name.toLowerCase(), marker.title?.toLowerCase() || ""],
					group: group.name,
				});
			});
		});

		return points;
	};

	const searchablePoints = createSearchablePoints();

	// Search function that can be used by AI or user input - currently unused
	// const searchPoints = (query: string) => {
	// 	const lowerQuery = query.toLowerCase();
	// 	return searchablePoints.filter(
	// 		(point) =>
	// 			point.title.toLowerCase().includes(lowerQuery) ||
	// 			point.group?.toLowerCase().includes(lowerQuery) ||
	// 			point.tags?.some((tag) => tag.includes(lowerQuery)) ||
	// 			point.description?.toLowerCase().includes(lowerQuery),
	// 	);
	// };

	// Handle KML toggle
	const handleKMLToggle = (visible: boolean) => {
		console.log("🔄 Page: KML toggle handler called with:", visible);
		console.log("🔄 Page: Current KML state before toggle:", kmlLayerVisible);
		setKmlLayerVisible(visible);
		console.log("🔄 Page: KML toggle completed, new visible state should be:", visible);
	};

	// Handle GeoJSON toggle
	const handleGeoJSONToggle = (visible: boolean) => {
		console.log("🔄 Page: GeoJSON toggle handler called with:", visible);
		console.log("🔄 Page: Current GeoJSON state before toggle:", geoJsonLayerVisible);
		console.log("🔄 Page: GeoJSON config object:", geoJsonLayerConfig);
		setGeoJsonLayerVisible(visible);
		console.log("🔄 Page: GeoJSON toggle completed, new visible state should be:", visible);
	};

	// Handle CCTV toggle
	const handleCCTVToggle = (visible: boolean) => {
		console.log("🎥 Page: CCTV toggle handler called with:", visible);
		setCctvLayerVisible(visible);
		console.log("🎥 Page: CCTV toggle completed, new visible state should be:", visible);
	};

	// Navigate to a specific point - currently unused
	// const navigateToPoint = (point: { lat: number; lng: number; zoom?: number }) => {
	// 	setSelectedPoint(point);
	// };

	// Handle marker clicks
	const handlePointClick = (point: { lat: number; lng: number; title?: string; group?: string; meta?: Record<string, unknown> }) => {
		// Check if this is a boundary click
		if (point.group === "Nashik Gramin Boundaries" && point.title && kmlFeatures) {
			// Find the matching boundary feature by name
			const boundary = kmlFeatures.find(f => f.name === point.title);
			if (boundary) {
				console.log("📍 Boundary clicked:", boundary.name);
				setSelectedBoundary(boundary);
				setSidebarActiveSection("areaview");
				return;
			}
		}

		const officerId = typeof point.meta?.officerId === "string" ? (point.meta.officerId as string) : undefined;
		if (officerId && point.group === "Duty Officers") {
			const matchedOfficer = officerList.find((officer) => officer.officerId === officerId);
			if (matchedOfficer) {
				setSelectedOfficer(matchedOfficer);
				setClickedPoint({
					lat: matchedOfficer.location.latitude,
					lng: matchedOfficer.location.longitude,
					title: matchedOfficer.name,
					group: "Duty Officers",
				});
				return;
			}
		}
		setClickedPoint(point);
		console.log("Clicked point:", point); // For AI integration
	};

	// Handle search and navigation - currently unused
	// const handleSearch = () => {
	// 	if (searchQuery.trim()) {
	// 		const results = searchPoints(searchQuery);
	// 		if (results.length > 0) {
	// 			const firstResult = results[0];
	// 			navigateToPoint({ ...firstResult.position, zoom: 16 });
	// 			setClickedPoint({
	// 				lat: firstResult.position.lat,
	// 				lng: firstResult.position.lng,
	// 				title: firstResult.title,
	// 				group: firstResult.group,
	// 			});
	// 		}
	// 	}
	// };

	// Area View Content - shows filtered data for selected boundary with toggle controls
	const areaViewContent = useMemo(() => {
		if (!selectedBoundary) {
			return (
				<div className="text-center py-8">
					<div className="text-5xl mb-4">🗺️</div>
					<h3 className="text-lg font-semibold text-gray-200 mb-2">Select an Area</h3>
					<p className="text-sm text-gray-400">
						Enable KML Boundaries and click on any area to explore its data
					</p>
				</div>
			);
		}

		// Filter data within the selected boundary
		const filterInBoundary = <T extends { latitude?: number | string; lng?: number; lat?: number; longitude?: number | string }>(items: T[]): T[] => {
			return items.filter(item => {
				const lat = typeof item.latitude === 'string' ? parseFloat(item.latitude) : (item.latitude ?? item.lat);
				const lng = typeof item.longitude === 'string' ? parseFloat(item.longitude) : (item.longitude ?? item.lng);
				if (lat === undefined || lng === undefined) return false;
				return isPointInPolygon({ lat, lng }, selectedBoundary.coordinates);
			});
		};

		// Debug: Log data counts
		console.log('🔍 AREA VIEW DATA DEBUG:', {
			boundaryName: selectedBoundary.name,
			boundaryCoordCount: selectedBoundary.coordinates?.length,
			firstCoord: selectedBoundary.coordinates?.[0],
			rawCounts: {
				dial112AllCalls: dial112AllCalls.length,
				accidentAllRecords: accidentAllRecords.length,
				policeLocations: policeLocations.length,
				hospitalLocations: hospitalLocations.length,
				atmLocations: atmLocations.length,
				bankLocations: bankLocations.length,
				cctvLocations: cctvLocations.length,
			}
		});

		const filteredPolice = filterInBoundary(policeLocations);
		const filteredHospitals = filterInBoundary(hospitalLocations);
		const filteredAtms = filterInBoundary(atmLocations);
		const filteredBanks = filterInBoundary(bankLocations);
		const filteredAccidents = filterInBoundary(accidentAllRecords);
		const filteredDial112 = filterInBoundary(dial112AllCalls);
		const filteredCctv = filterInBoundary(cctvLocations);

		// Debug: Log filtered counts
		console.log('📊 AREA VIEW FILTERED COUNTS:', {
			filteredDial112: filteredDial112.length,
			filteredAccidents: filteredAccidents.length,
			filteredPolice: filteredPolice.length,
			filteredHospitals: filteredHospitals.length,
		});

		// If dial112 has data but filtered is 0, log a sample point for debugging
		if (dial112AllCalls.length > 0 && filteredDial112.length === 0) {
			const samplePoint = dial112AllCalls[0];
			console.log('⚠️ DIAL112 SAMPLE POINT (not matching boundary):', {
				lat: samplePoint.latitude,
				lng: samplePoint.longitude,
				boundaryFirstCoord: selectedBoundary.coordinates?.[0],
				boundaryLastCoord: selectedBoundary.coordinates?.[selectedBoundary.coordinates.length - 1],
			});
		}

		// Layer definitions for core layers
		const coreLayers = [
			{ key: 'dial112' as const, icon: '🚨', label: 'Dial 112 Points' },
			{ key: 'dial112Heatmap' as const, icon: '🔥', label: 'Dial 112 Heatmap' },
			{ key: 'accidents' as const, icon: '🚗', label: 'Accident Points' },
			{ key: 'accidentsHeatmap' as const, icon: '🔥', label: 'Accident Heatmap' },
			// { key: 'police' as const, icon: '🚔', label: 'Police Stations' },
		];

		// Combine all layers and calculate counts
		const allLayers = coreLayers.map(layer => {
			let count = 0;
			if (layer.key === 'dial112') count = filteredDial112.length;
			else if (layer.key === 'accidents') count = filteredAccidents.length;
			// else if (layer.key === 'police') count = filteredPolice.length;
			// Heatmaps use the same filtered data counts effectively
			else if (layer.key === 'dial112Heatmap') count = filteredDial112.length;
			else if (layer.key === 'accidentsHeatmap') count = filteredAccidents.length;

			return { ...layer, count };
		});

		// Dynamic layers removed from Area View as requested
		// const dynamicLayers = categories.map(cat => ({ ... }));

		const fullLayerList = [...allLayers];

		return (
			<div className="flex flex-col h-full">
				{/* Header with boundary name */}
				<div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-xl p-4 mb-4">
					<div className="flex items-center justify-between">
						<div>
							<div className="text-xs text-cyan-400 font-semibold uppercase tracking-wider mb-1">📍 Selected Area</div>
							<h3 className="text-lg font-bold text-white leading-tight">{selectedBoundary.name}</h3>
						</div>
						<button
							onClick={() => {
								setSelectedBoundary(null);
								setSidebarActiveSection("layers");
								setAreaLayerToggles({
									dial112: false, accidents: false, police: false,
									hospitals: false, atms: false, banks: false, cctv: false
								});
							}}
							className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>

				<button
					onClick={() => {
						const coords = selectedBoundary.coordinates;
						const avgLat = coords.reduce((sum, c) => sum + c.lat, 0) / coords.length;
						const avgLng = coords.reduce((sum, c) => sum + c.lng, 0) / coords.length;
						setSelectedPoint({ lat: avgLat, lng: avgLng, zoom: 13 });
					}}
					className="w-full py-2.5 mb-6 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20"
				>
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
					</svg>
					Zoom to Area
				</button>

				<div className="space-y-3 flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
					<div className="flex items-center justify-between mb-2">
						<h3 className="text-sm font-medium text-gray-300">Area Layers</h3>
						<span className="text-[10px] bg-white/5 px-2 py-1 rounded text-gray-500 uppercase tracking-widest">Filters Active</span>
					</div>

					<div className="space-y-2 pb-10">
						{fullLayerList.map((layer) => (
							<div key={layer.key} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all duration-200 group">
								<div className="flex items-center gap-3">
									<span className="text-xl group-hover:scale-110 transition-transform">{layer.icon}</span>
									<div>
										<div className="flex items-center gap-2">
											<span className="text-sm font-medium text-gray-200">{layer.label}</span>
											{areaLayerToggles[layer.key] && (
												<span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
											)}
										</div>
										<p className="text-xs text-gray-400 mt-0.5">
											{layer.count} {layer.count === 1 ? 'location' : 'locations'}
										</p>
									</div>
								</div>
								<SliderV1
									checked={!!areaLayerToggles[layer.key]}
									onChange={(checked) => {
										console.log(`🔘 Toggling Area Layer ${layer.key} to ${checked}`);
										setAreaLayerToggles(prev => ({
											...prev,
											[layer.key]: checked
										}));
									}}
									id={`area-layer-${layer.key}`}
								/>
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}, [selectedBoundary, policeLocations, hospitalLocations, atmLocations, bankLocations, accidentAllRecords, dial112AllCalls, cctvLocations, areaLayerToggles, categories, categoryData]);
	// Debug logging for render props
	console.log("🗺️ Page: Rendering with current state:", {
		kmlLayerConfig,
		geoJsonLayerConfig,
		kmlLayerVisible,
		geoJsonLayerVisible,
		kmlLayerUrl: kmlLayerConfig.url,
		geoJsonLayerUrl: geoJsonLayerConfig.url,
		kmlAbsoluteUrl,
		isClient: typeof window !== "undefined",
	});

	return (
		<>
			{/* Header */}
			<div className="fixed top-0 left-0 right-0 z-50 bg-black backdrop-blur-md border-b border-white/10">
				<div className="flex items-center justify-between h-16 px-6">
					<h1 className="text-2xl font-bold text-white tracking-wide">NASHIK GIS 2.0</h1>
					<a
						href="/health"
						className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
					>
						Health Check
					</a>
				</div>
			</div>

			<Sidebar
				onActiveSectionChange={(sectionId) => {
					setSidebarActiveSection(sectionId);
					const isOfficersPanel = sectionId === "officers";
					setOfficerPanelActive(isOfficersPanel);
					// Fetch officers when panel is first opened if not already loaded
					if (isOfficersPanel && officerList.length === 0 && !officerLoading && fetchDutyOfficersRef.current) {
						fetchDutyOfficersRef.current();
					}
					// Clear selected boundary if switching away from area view
					if (sectionId !== "areaview") {
						setSelectedBoundary(null);
					}
				}}
				externalActiveSection={sidebarActiveSection}
				areaViewContent={areaViewContent}
				onSearch={handleSearch}
				searchResults={searchResults}
				onSearchResultClick={handleSearchResultClick}
				isSearching={isSearching}
				officerTrackingContent={officerTrackingContent}
				settingsContent={
					<div className="space-y-3">
						<h3 className="text-sm font-medium text-gray-300 mb-3">Data Categories</h3>
						{categories.length === 0 ? (
							<div className="text-center py-8">
								<div className="text-gray-400 mb-4">
									<div className="w-12 h-12 mx-auto mb-3 border-2 border-gray-600 border-t-gray-200 rounded-full animate-spin"></div>
									<p className="text-sm text-gray-400 mb-2">Loading categories...</p>
								</div>
							</div>
						) : (
							<div className="space-y-2">
								{categories.filter(category => category.name === "Police Stations").map((category) => {
									const isExpanded = expandedCategories.has(category.id);
									const isLoading = categoryLoading[category.id] || false;
									const pointCount = categoryData[category.id]?.length || 0;

									return (
										<div
											key={category.id}
											className="space-y-1"
										>
											{/* Category Toggle */}
											<div className="flex items-center justify-between cursor-pointer group">
												<div
													className="flex-1 flex items-center space-x-2"
													onClick={() => {
														const newExpanded = new Set(expandedCategories);
														if (newExpanded.has(category.id)) {
															newExpanded.delete(category.id);
														} else {
															newExpanded.add(category.id);
														}
														setExpandedCategories(newExpanded);
													}}
												>
													{/* Chevron Icon */}
													<svg
														className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M9 5l7 7-7 7"
														/>
													</svg>
													<div
														className="w-3 h-3 rounded-full border border-white/20 shrink-0"
														style={{ backgroundColor: category.color }}
													></div>
													<span className="text-sm font-medium text-gray-200 truncate">{category.name}</span>
													<span
														className={`px-2 py-0.5 text-xs rounded-full transition-colors ${categoryToggles[category.id] ? `border` : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
															}`}
														style={
															categoryToggles[category.id]
																? {
																	background: `${category.color}20`,
																	color: category.color,
																	borderColor: `${category.color}30`,
																}
																: undefined
														}
													>
														{pointCount > 0 ? `${pointCount}` : ""}
													</span>
													{isLoading && <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin shrink-0"></div>}
												</div>
												<SliderV1
													checked={categoryToggles[category.id] || false}
													onChange={(checked) => {
														setCategoryToggles((prev) => ({ ...prev, [category.id]: checked }));
														if (checked) {
															// Expand category when enabled
															const newExpanded = new Set(expandedCategories);
															newExpanded.add(category.id);
															setExpandedCategories(newExpanded);
														}
													}}
													id={`settings-category-${category.id}`}
												/>
											</div>

											{/* Subcategories (expanded) */}
											{isExpanded && category.subcategories.length > 0 && (
												<div className="ml-7 space-y-1">
													{category.subcategories.map((subcategory) => {
														const subcatPoints = (categoryData[category.id] || []).filter((p) => p.subcategory_id === subcategory.id).length;

														return (
															<div
																key={subcategory.id}
																className="flex items-center justify-between cursor-pointer group"
															>
																<div className="flex-1 min-w-0">
																	<div className="flex items-center space-x-2">
																		<span className="text-xs font-medium text-gray-300 truncate max-w-[120px]">{subcategory.name}</span>
																		<span
																			className={`px-2 py-0.5 text-xs rounded-full transition-colors ${subcategoryToggles[category.id]?.[subcategory.id] ? `border` : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
																				}`}
																			style={
																				subcategoryToggles[category.id]?.[subcategory.id]
																					? {
																						background: `${category.color}20`,
																						color: category.color,
																						borderColor: `${category.color}30`,
																					}
																					: undefined
																			}
																		>
																			{subcatPoints > 0 ? `${subcatPoints}` : ""}
																		</span>
																	</div>
																</div>
																<SliderV1
																	checked={subcategoryToggles[category.id]?.[subcategory.id] || false}
																	onChange={(checked) => {
																		setSubcategoryToggles((prev) => ({
																			...prev,
																			[category.id]: {
																				...prev[category.id],
																				[subcategory.id]: checked,
																			},
																		}));
																	}}
																	id={`settings-subcat-${category.id}-${subcategory.id}`}
																/>
															</div>
														);
													})}
												</div>
											)}
										</div>
									);
								})}
							</div>
						)}
					</div>
				}
				emergencyContent={
					<EmergencyTab
						hospitals={hospitalLocations}
						policeStations={policeStations}
						dial112Calls={dial112AllCalls}
						officers={officerList}
						currentCenter={
							selectedPoint?.lat
								? { lat: selectedPoint.lat, lng: selectedPoint.lng }
								: mapBounds
									? { lat: (mapBounds.north + mapBounds.south) / 2, lng: (mapBounds.east + mapBounds.west) / 2 }
									: { lat: 20.0112771, lng: 74.00833808 }
						}
						onLocateNearest={(point) => {
							setClickedPoint({
								lat: point.lat,
								lng: point.lng,
								title: point.title,
								group: point.type,
							});
							// We could also zoom, but for now just popup
						}}
						onDrawRoute={setDirections}
					/>
				}
				processionRoutes={
					<div className="space-y-4">
						{processedProcessionRoutes.length > 0 ? (
							<div className="space-y-3">
								{/* ALL Toggle */}
								<div className="flex items-center justify-between cursor-pointer group border-b border-gray-700/50 pb-3 mb-3">
									<div className="flex-1 min-w-0">
										<div className="flex items-center space-x-2">
											<span className="text-sm font-medium text-gray-200">ALL</span>
											<span
												className={`px-2 py-0.5 text-xs rounded-full transition-colors shrink-0 ${Object.values(processionsVisible).every((visible) => visible)
													? "bg-green-500/20 text-green-400 border border-green-500/30"
													: Object.values(processionsVisible).some((visible) => visible)
														? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
														: "bg-gray-700/50 text-gray-500 border border-gray-600/30"
													}`}
											>
												{Object.values(processionsVisible).every((visible) => visible)
													? "ALL ON"
													: Object.values(processionsVisible).some((visible) => visible)
														? "SOME ON"
														: "ALL OFF"}
											</span>
										</div>
										<p className="text-xs text-gray-400 mt-0.5">Toggle all {processedProcessionRoutes.length} festivals</p>
									</div>
									<SliderV1
										checked={Object.values(processionsVisible).every((visible) => visible)}
										onChange={(checked) => {
											const newVisibility: { [festivalName: string]: boolean } = {};
											processedProcessionRoutes.forEach((festival) => {
												newVisibility[festival.festivalName] = checked;
											});
											setProcessionsVisible(newVisibility);
										}}
										id="processions-all"
									/>
								</div>

								{processedProcessionRoutes.map((festivalGroup) => (
									<div
										key={festivalGroup.festivalName}
										className="flex items-center justify-between cursor-pointer group"
									>
										<div className="flex-1 min-w-0">
											<div className="flex items-center space-x-2">
												<div
													className="w-3 h-3 rounded-full border border-white/20 shrink-0"
													style={{ backgroundColor: festivalGroup.color }}
												></div>
												<span className="text-sm font-medium text-gray-200 truncate max-w-[120px]">
													{festivalGroup.festivalName.length > 14 ? `${festivalGroup.festivalName.substring(0, 14)}...` : festivalGroup.festivalName}
												</span>
												<span
													className={`px-2 py-0.5 text-xs rounded-full transition-colors shrink-0 ${processionsVisible[festivalGroup.festivalName]
														? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
														: "bg-gray-700/50 text-gray-500 border border-gray-600/30"
														}`}
												>
													{processionsVisible[festivalGroup.festivalName] ? "ON" : "OFF"}
												</span>
												{processionLoading && <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin shrink-0"></div>}
											</div>
											<p className="text-xs text-gray-400 mt-0.5 truncate">
												{festivalGroup.routes.length} route{festivalGroup.routes.length !== 1 ? "s" : ""}
											</p>
										</div>
										<SliderV1
											checked={processionsVisible[festivalGroup.festivalName] || false}
											onChange={(checked) => {
												setProcessionsVisible((prev) => ({
													...prev,
													[festivalGroup.festivalName]: checked,
												}));
											}}
											id={`procession-${festivalGroup.festivalName.replace(/\s+/g, "-").toLowerCase()}`}
										/>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-8">
								<div className="text-gray-400 mb-4">
									<svg
										className="w-12 h-12 mx-auto mb-3 text-gray-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={1.5}
											d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
										/>
									</svg>
									<p className="text-sm text-gray-400 mb-2">No procession routes loaded</p>
									<p className="text-xs text-gray-500">Click the button below to load available festival routes</p>
								</div>
								<button
									onClick={async () => {
										setProcessionLoading(true);
										try {
											console.log("🛤️ Loading Procession Routes data...");
											const data = await fetchProcessionRoutes();
											setProcessionRoutes(data);
											console.log(`✅ Loaded ${data.length} Procession Routes`);
										} catch (error) {
											console.error("❌ Failed to load Procession Routes data:", error);
										} finally {
											setProcessionLoading(false);
										}
									}}
									disabled={processionLoading}
									className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 mx-auto"
								>
									{processionLoading ? (
										<>
											<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
											<span>Loading...</span>
										</>
									) : (
										<>
											<svg
												className="w-4 h-4"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
												/>
											</svg>
											<span>Load Procession Routes</span>
										</>
									)}
								</button>
							</div>
						)}
					</div>
				}
			>
				<div className="space-y-4">
					<div className="space-y-3">
						<h3 className="text-sm font-medium text-gray-300 mb-3">Map Layers</h3>
						<div className="space-y-3">
							{/* KML Layer Toggle */}
							<div className="flex items-center justify-between cursor-pointer group">
								<div className="flex-1">
									<div className="flex items-center space-x-2">
										<span className="text-sm font-medium text-gray-200">🗺️ KML Boundaries</span>
										<span
											className={`px-2 py-0.5 text-xs rounded-full transition-colors ${kmlLayerVisible ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
												}`}
										>
											{kmlLayerVisible ? "ON" : "OFF"}
										</span>
									</div>
									<p className="text-xs text-gray-400 mt-0.5">Nashik Gramin boundaries (auto-fallback)</p>
								</div>
								<SliderV1
									checked={kmlLayerVisible}
									onChange={handleKMLToggle}
									id="layer-kml"
								/>
							</div>

							{/* GeoJSON Layer Toggle */}
							<div className="flex items-center justify-between cursor-pointer group">
								<div className="flex-1">
									<div className="flex items-center space-x-2">
										<span className="text-sm font-medium text-gray-200">🗺️ GeoJSON Layer</span>
										<span
											className={`px-2 py-0.5 text-xs rounded-full transition-colors ${geoJsonLayerVisible ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
												}`}
										>
											{geoJsonLayerVisible ? "ON" : "OFF"}
										</span>
									</div>
									<p className="text-xs text-gray-400 mt-0.5">Alternative boundary display</p>
								</div>
								<SliderV1
									checked={geoJsonLayerVisible}
									onChange={handleGeoJSONToggle}
									id="layer-geojson"
								/>
							</div>

							{/* Dial 112 Points Toggle */}
							<div className="flex items-center justify-between cursor-pointer group">
								<div className="flex-1">
									<div className="flex items-center space-x-2">
										<span className="text-sm font-medium text-gray-200">🚨 Dial 112 Points</span>
										<span
											className={`px-2 py-0.5 text-xs rounded-full transition-colors ${dial112Visible ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
												}`}
										>
											{dial112Visible ? "ON" : "OFF"}
										</span>
										{dial112Loading && <div className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin"></div>}
									</div>
									<p className="text-xs text-gray-400 mt-0.5">Viewport-filtered markers ({dial112Calls.length} visible)</p>
								</div>
								<SliderV1
									checked={dial112Visible}
									onChange={setDial112Visible}
									id="layer-dial112"
								/>
							</div>

							{/* Dial 112 Heatmap Toggle */}
							<div className="flex items-center justify-between cursor-pointer group">
								<div className="flex-1">
									<div className="flex items-center space-x-2">
										<span className="text-sm font-medium text-gray-200">🔥 Dial 112 Heatmap</span>
										<span
											className={`px-2 py-0.5 text-xs rounded-full transition-colors ${dial112HeatmapVisible ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
												}`}
										>
											{dial112HeatmapVisible ? "ON" : "OFF"}
										</span>
									</div>
									<p className="text-xs text-gray-400 mt-0.5">Density visualization ({dial112AllCalls.length} total)</p>
								</div>
								<SliderV1
									checked={dial112HeatmapVisible}
									onChange={setDial112HeatmapVisible}
									id="layer-dial112-heatmap"
								/>
							</div>

							{/* Accident Points Toggle */}
							<div className="flex items-center justify-between cursor-pointer group">
								<div className="flex-1">
									<div className="flex items-center space-x-2">
										<span className="text-sm font-medium text-gray-200">🚗 Accident Points</span>
										<span
											className={`px-2 py-0.5 text-xs rounded-full transition-colors ${accidentVisible ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
												}`}
										>
											{accidentVisible ? "ON" : "OFF"}
										</span>
										{accidentLoading && <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin"></div>}
									</div>
									<p className="text-xs text-gray-400 mt-0.5">Viewport-filtered markers ({accidentRecords.length} visible)</p>
								</div>
								<SliderV1
									checked={accidentVisible}
									onChange={setAccidentVisible}
									id="layer-accident"
								/>
							</div>

							{/* Accident Heatmap Toggle */}
							<div className="flex items-center justify-between cursor-pointer group">
								<div className="flex-1">
									<div className="flex items-center space-x-2">
										<span className="text-sm font-medium text-gray-200">🔥 Accident Heatmap</span>
										<span
											className={`px-2 py-0.5 text-xs rounded-full transition-colors ${accidentHeatmapVisible ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
												}`}
										>
											{accidentHeatmapVisible ? "ON" : "OFF"}
										</span>
									</div>
									<p className="text-xs text-gray-400 mt-0.5">Density visualization ({accidentAllRecords.length} total)</p>
								</div>
								<SliderV1
									checked={accidentHeatmapVisible}
									onChange={setAccidentHeatmapVisible}
									id="layer-accident-heatmap"
								/>
							</div>

							{/* Divider before categories */}
							<div className="border-t border-gray-700/50 pt-3 mt-3"></div>

							{/* Categories */}
							{categories.length === 0 ? (
								<div className="text-center py-4">
									<div className="text-gray-400 mb-2">
										<div className="w-8 h-8 mx-auto mb-2 border-2 border-gray-600 border-t-gray-200 rounded-full animate-spin"></div>
										<p className="text-xs text-gray-400">Loading categories...</p>
									</div>
								</div>
							) : (
								<div className="space-y-2">
									{categories.map((category) => {
										const isExpanded = expandedCategories.has(category.id);
										const isLoading = categoryLoading[category.id] || false;
										const pointCount = categoryData[category.id]?.length || 0;

										return (
											<div
												key={category.id}
												className="space-y-1"
											>
												{/* Category Toggle */}
												<div className="flex items-center justify-between cursor-pointer group">
													<div
														className="flex-1 flex items-center space-x-2"
														onClick={() => {
															const newExpanded = new Set(expandedCategories);
															if (newExpanded.has(category.id)) {
																newExpanded.delete(category.id);
															} else {
																newExpanded.add(category.id);
															}
															setExpandedCategories(newExpanded);
														}}
													>
														{/* Chevron Icon */}
														<svg
															className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth={2}
																d="M9 5l7 7-7 7"
															/>
														</svg>
														<div
															className="w-3 h-3 rounded-full border border-white/20 shrink-0"
															style={{ backgroundColor: category.color }}
														></div>
														<span className="text-sm font-medium text-gray-200 truncate">{category.name}</span>
														<span
															className={`px-2 py-0.5 text-xs rounded-full transition-colors ${categoryToggles[category.id] ? `border` : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
																}`}
															style={
																categoryToggles[category.id]
																	? {
																		background: `${category.color}20`,
																		color: category.color,
																		borderColor: `${category.color}30`,
																	}
																	: undefined
															}
														>
															{pointCount > 0 ? `${pointCount}` : ""}
														</span>
														{isLoading && <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin shrink-0"></div>}
													</div>
													<SliderV1
														checked={categoryToggles[category.id] || false}
														onChange={(checked) => {
															setCategoryToggles((prev) => ({ ...prev, [category.id]: checked }));
															if (checked) {
																// Expand category when enabled
																const newExpanded = new Set(expandedCategories);
																newExpanded.add(category.id);
																setExpandedCategories(newExpanded);
															}
														}}
														id={`layer-category-${category.id}`}
													/>
												</div>

												{/* Subcategories (expanded) */}
												{isExpanded && category.subcategories.length > 0 && (
													<div className="ml-7 space-y-1">
														{category.subcategories.map((subcategory) => {
															const subcatPoints = (categoryData[category.id] || []).filter((p) => p.subcategory_id === subcategory.id).length;

															return (
																<div
																	key={subcategory.id}
																	className="flex items-center justify-between cursor-pointer group"
																>
																	<div className="flex-1 min-w-0">
																		<div className="flex items-center space-x-2">
																			<span className="text-xs font-medium text-gray-300 truncate max-w-[120px]">{subcategory.name}</span>
																			<span
																				className={`px-2 py-0.5 text-xs rounded-full transition-colors ${subcategoryToggles[category.id]?.[subcategory.id]
																					? `border`
																					: "bg-gray-700/50 text-gray-500 border border-gray-600/30"
																					}`}
																				style={
																					subcategoryToggles[category.id]?.[subcategory.id]
																						? {
																							background: `${category.color}20`,
																							color: category.color,
																							borderColor: `${category.color}30`,
																						}
																						: undefined
																				}
																			>
																				{subcatPoints > 0 ? `${subcatPoints}` : ""}
																			</span>
																		</div>
																	</div>
																	<SliderV1
																		checked={subcategoryToggles[category.id]?.[subcategory.id] || false}
																		onChange={(checked) => {
																			setSubcategoryToggles((prev) => ({
																				...prev,
																				[category.id]: {
																					...prev[category.id],
																					[subcategory.id]: checked,
																				},
																			}));
																		}}
																		id={`layer-subcat-${category.id}-${subcategory.id}`}
																	/>
																</div>
															);
														})}
													</div>
												)}
											</div>
										);
									})}
								</div>
							)}
						</div>

						{/* Layer Statistics */}
						<div className="border-t border-gray-700/50 pt-3 mt-4">
							<div className="text-xs text-gray-500 space-y-1">
								<div className="flex justify-between">
									<span>Active Layers:</span>
									<span className="font-medium">
										{[kmlLayerVisible, geoJsonLayerVisible, dial112Visible, dial112HeatmapVisible, accidentVisible, accidentHeatmapVisible].filter(Boolean).length}
										/6
									</span>
								</div>
								<div className="flex justify-between">
									<span>Dial 112 Calls:</span>
									<span className="font-medium text-amber-400">
										{dial112Calls.length} visible / {dial112AllCalls.length} total
									</span>
								</div>
								<div className="flex justify-between">
									<span>Accident Records:</span>
									<span className="font-medium text-red-400">
										{accidentRecords.length} visible / {accidentAllRecords.length} total
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</Sidebar>

			{/* Full-screen map positioned behind sidebar and header */}
			<div className="fixed inset-0 pt-16">
				<GoogleMap
					center={{ lat: 20.0112771, lng: 74.00833808 }}
					zoom={10}
					height="100vh"
					width="100vw"
					className="w-full h-full"
					markerGroups={markerGroups}
					polylines={processedProcessionRoutes}
					heatmap={{
						data: [
							...(selectedBoundary
								? (areaLayerToggles.dial112Heatmap ? dial112HeatmapData.data.filter(d => isPointInPolygon(d.position, selectedBoundary.coordinates)) : [])
								: (dial112HeatmapVisible ? dial112HeatmapData.data : [])
							),
							...(selectedBoundary
								? (areaLayerToggles.accidentsHeatmap ? accidentHeatmapData.data.filter(d => isPointInPolygon(d.position, selectedBoundary.coordinates)) : [])
								: (accidentHeatmapVisible ? accidentHeatmapData.data : [])
							),
							...(selectedBoundary
								? (areaLayerToggles.atmHeatmap ? atmHeatmapData.data.filter(d => isPointInPolygon(d.position, selectedBoundary.coordinates)) : [])
								: (atmHeatmapVisible ? atmHeatmapData.data : [])
							),
							...(selectedBoundary
								? (areaLayerToggles.bankHeatmap ? bankHeatmapData.data.filter(d => isPointInPolygon(d.position, selectedBoundary.coordinates)) : [])
								: (bankHeatmapVisible ? bankHeatmapData.data : [])
							),
							...(selectedBoundary
								? (areaLayerToggles.hospitalHeatmap ? hospitalHeatmapData.data.filter(d => isPointInPolygon(d.position, selectedBoundary.coordinates)) : [])
								: (hospitalHeatmapVisible ? hospitalHeatmapData.data : [])
							),
							...(selectedBoundary
								? (areaLayerToggles.policeHeatmap ? policeHeatmapData.data.filter(d => isPointInPolygon(d.position, selectedBoundary.coordinates)) : [])
								: (policeHeatmapVisible ? policeHeatmapData.data : [])
							),
						],
						visible: selectedBoundary
							? (areaLayerToggles.dial112Heatmap || areaLayerToggles.accidentsHeatmap || areaLayerToggles.atmHeatmap || areaLayerToggles.bankHeatmap || areaLayerToggles.hospitalHeatmap || areaLayerToggles.policeHeatmap)
							: (dial112HeatmapVisible || accidentHeatmapVisible || atmHeatmapVisible || bankHeatmapVisible || hospitalHeatmapVisible || policeHeatmapVisible),
						radius: 20,
						opacity: 0.6,
						gradient: dial112HeatmapVisible
							? dial112HeatmapData.gradient
							: accidentHeatmapVisible
								? accidentHeatmapData.gradient
								: atmHeatmapVisible
									? atmHeatmapData.gradient
									: bankHeatmapVisible
										? bankHeatmapData.gradient
										: hospitalHeatmapVisible
											? hospitalHeatmapData.gradient
											: policeHeatmapVisible
												? policeHeatmapData.gradient
												: dial112HeatmapData.gradient,
					}}
					kmlLayer={kmlLayerConfig}
					geoJsonLayer={geoJsonLayerConfig}
					selectedPoint={selectedPoint}
					onPointClick={handlePointClick}
					onRouteClick={async (route) => {
						// Lazy load KML features and police stations if absent
						if (!kmlFeatures) {
							try {
								const parsed = await parseKMLFile(kmlAbsoluteUrl);
								if (parsed.success) {
									setKmlFeatures(parsed.features);
									setKmlMarkers(parsed.markers);
								}
							} catch {
								// ignore
							}
						}
						if (!policeStations) {
							try {
								const stations = await fetchPoliceStations();
								setPoliceStations(stations);
							} catch {
								// ignore
							}
						}

						// Fallback: build station-like list from KML markers if API returned none
						let stationPool: StationLike[] = Array.isArray(policeStations) && policeStations.length > 0 ? policeStations : [];
						if (stationPool.length === 0) {
							if (!kmlMarkers && !kmlFeatures) {
								try {
									const parsed = await parseKMLFile(kmlAbsoluteUrl);
									if (parsed.success) {
										setKmlFeatures(parsed.features);
										setKmlMarkers(parsed.markers);
									}
								} catch {
									// ignore
								}
							}
							const markers = kmlMarkers || [];
							stationPool = markers.map((m) => ({ name: m.title, latitude: m.position.lat, longitude: m.position.lng }));
						}

						let villageName: string | null = null;
						if (kmlFeatures) {
							villageName = findVillageName(route.startPoint, route.endPoint, kmlFeatures);
						}

						let nearestStation: { name: string; distanceMeters: number } | null = null;
						nearestStation = findNearestPoliceStation(route.path, stationPool);

						setSelectedRoute({
							...route,
							police_station: nearestStation?.name ?? route.police_station,
							village: villageName ?? route.village,
						});
					}}
					searchablePoints={searchablePoints}
					onKMLToggle={handleKMLToggle}
					onGeoJSONToggle={handleGeoJSONToggle}
					onCCTVToggle={handleCCTVToggle}
					onBoundsChanged={setMapBounds}
					showLayerControls={false}
					directions={directions}
				/>

				{/* Street View popup container (top-right) */}
				<div className="pointer-events-none fixed top-20 right-4 z-60">
					<AnimatePresence>
						{clickedPoint && !selectedOfficer && (
							<div className="pointer-events-auto">
								<StreetViewPopup
									key={`${clickedPoint.lat.toFixed(6)}_${clickedPoint.lng.toFixed(6)}`}
									point={clickedPoint}
									onClose={() => setClickedPoint(null)}
								/>
							</div>
						)}
					</AnimatePresence>
				</div>

				{/* Officer popup - fixed right side (replaces Street View when officer selected) */}
				<div className="pointer-events-none fixed top-20 right-4 z-60">
					<AnimatePresence mode="wait">
						{selectedOfficer && (
							<div className="pointer-events-auto">
								<OfficerPopup
									key={selectedOfficer.officerId}
									officer={selectedOfficer}
									onClose={() => {
										setSelectedOfficer(null);
										setClickedPoint(null);
									}}
								/>
							</div>
						)}
					</AnimatePresence>
				</div>

				{/* Route details drawer */}
				<Drawer
					open={!!selectedRoute}
					onOpenChange={(open) => !open && setSelectedRoute(null)}
					direction="right"
				>
					<DrawerContent className="w-full sm:max-w-sm bg-black">
						<DrawerHeader className=" bg-black/40">
							<DrawerTitle>{selectedRoute?.festivalName || "Procession Route"}</DrawerTitle>
						</DrawerHeader>
						<div className="p-4 space-y-4 text-sm text-gray-200">
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">Procession #:</span>
								<span className="font-medium">{selectedRoute?.procession_number}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">Festival:</span>
								<span className="font-medium">{selectedRoute?.festival_name}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">Police Station:</span>
								<span className="font-medium">{selectedRoute?.police_station || "—"}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">Village:</span>
								<span className="font-medium">{selectedRoute?.village || "—"}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">Distance:</span>
								<span className="font-medium">{(selectedRoute?.total_distance ?? 0).toFixed(2)} km</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">Timing:</span>
								<span className="font-medium">
									{selectedRoute?.start_time || "?"} → {selectedRoute?.end_time || "?"} ({selectedRoute?.duration_minutes ?? "?"} min)
								</span>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3">
									<div className="text-xs font-semibold uppercase tracking-wide text-emerald-400">Start Point</div>
									<div className="mt-1 text-sm font-medium text-emerald-200">{selectedRoute?.start_address}</div>
								</div>
								<div className="rounded-md border border-red-500/30 bg-red-500/10 p-3">
									<div className="text-xs font-semibold uppercase tracking-wide text-red-400">End Point</div>
									<div className="mt-1 text-sm font-medium text-red-200">{selectedRoute?.end_address}</div>
								</div>
							</div>
							{selectedRoute?.description && <p className="text-muted-foreground">{selectedRoute.description}</p>}

							{/* Comprehensive Procession Report */}
							<ProcessionReport
								route={selectedRoute}
								dial112Calls={dial112AllCalls}
								accidentRecords={accidentAllRecords}
								allMapPoints={Object.values(categoryData).flat()}
							/>
						</div>
						<div className="p-4">
							<DrawerClose className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm bg-white/10 text-white">Close</DrawerClose>
						</div>
					</DrawerContent>
				</Drawer>
			</div>

			{/* Add the GooeyFilter for the liquid toggle effects */}
		</>
	);
}
