"use client";

import GoogleMap from "@/components/GoogleMap";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import Sidebar from "@/components/Sidebar";
import { Toggle, GooeyFilter } from "@/components/LiquidToggle";
import { parseKMLFile, type KMLFeature, type KMLMarker } from "@/utils/kmlParser";
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
	type AccidentRecord,
	streamAccidentData,
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

export default function Home() {
	// State for selected point and search
	const [selectedPoint, setSelectedPoint] = useState<{ lat: number; lng: number; zoom?: number } | undefined>();
	// const [searchQuery] = useState(""); // Currently unused
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

	// State for absolute URLs (client-side only)
	const [kmlAbsoluteUrl, setKmlAbsoluteUrl] = useState("/kml/nashik_gramin.kml");

	// Only construct absolute URL for GoogleMap component
	useEffect(() => {
		if (typeof window !== "undefined") {
			setKmlAbsoluteUrl(`${window.location.origin}/kml/nashik_gramin.kml`);
		}
	}, []);

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
			if (policeLayerVisible && policeLocations.length === 0 && !policeLoading) {
				setPoliceLoading(true);
				try {
					console.log("🚔 Loading Police Station data...");
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
	}, [policeLayerVisible, policeLocations.length, policeLoading]);

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

		if ((dial112Visible || dial112HeatmapVisible) && !dial112LoadingRef.current) {
			console.log("🚨 Starting Dial 112 SSE stream subscription...");
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
	}, [dial112Visible, dial112HeatmapVisible]);

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

		if ((accidentVisible || accidentHeatmapVisible) && !accidentLoadingRef.current) {
			console.log("🚗 Starting Accident Data SSE stream subscription...");
			accidentLoadingRef.current = true;
			setAccidentLoading(true);
			accumulatedRecords = [];
			setAccidentAllRecords([]);
			streamAccidentData(
				(row) => {
					console.log("🚗 Received accident row:", row);
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
	}, [accidentVisible, accidentHeatmapVisible]);

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

	// Load category data when toggle is enabled (lazy loading)
	useEffect(() => {
		const loadCategoryData = async (categoryId: number) => {
			if (!categoryToggles[categoryId] || categoryLoading[categoryId] || categoryData[categoryId]) {
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
			if (categoryToggles[category.id]) {
				loadCategoryData(category.id);
			}
		});
	}, [categories, categoryToggles, categoryLoading, categoryData]);

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
		() => [
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
				name: "Dial 112 Calls",
				color: "#EAB308", // Amber
				visible: dial112Visible,
				markers: dial112Calls.map((c) => ({
					position: { lat: c.latitude, lng: c.longitude },
					title: c.eventId || c.policeStation || "Dial 112 Call",
					label: "112",
				})),
			},
			// Real CCTV data from external API
			{
				name: "CCTV Cameras",
				color: "#F97316", // Orange
				visible: cctvLayerVisible,
				markers: cctvLocations.map((cctv) => ({
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
				visible: atmLayerVisible,
				markers: atmLocations.map((atm) => ({
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
				visible: bankLayerVisible,
				markers: bankLocations.map((bank) => ({
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
				visible: hospitalLayerVisible,
				markers: hospitalLocations.map((hospital) => ({
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
				visible: policeLayerVisible,
				markers: policeLocations.map((police) => ({
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
				visible: accidentVisible,
				markers: (() => {
					console.log(`🚗 Creating ${accidentRecords.length} accident markers`);
					return accidentRecords.map((accident) => {
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
				.filter((category) => categoryToggles[category.id])
				.map((category) => {
					const points = categoryData[category.id] || [];
					// Filter by active subcategories if any are enabled
					const activeSubcats = Object.entries(subcategoryToggles[category.id] || {})
						.filter(([, enabled]) => enabled)
						.map(([subcatId]) => parseInt(subcatId));

					let filteredPoints = points;
					if (activeSubcats.length > 0) {
						filteredPoints = points.filter((point) => activeSubcats.includes(point.subcategory_id));
					}

					// Apply viewport filtering and zoom-based decimation like Dial 112
					if (mapBounds) {
						const { north, south, east, west, zoom } = mapBounds;
						let skipFactor = 1;
						if (zoom < 10) skipFactor = 50;
						else if (zoom < 12) skipFactor = 20;
						else if (zoom < 14) skipFactor = 10;
						else if (zoom < 16) skipFactor = 5;

						// First filter by viewport
						filteredPoints = filteredPoints.filter((point) => {
							const lat = typeof point.latitude === "string" ? parseFloat(point.latitude) : parseFloat(String(point.latitude));
							const lng = typeof point.longitude === "string" ? parseFloat(point.longitude) : parseFloat(String(point.longitude));
							return lat >= south && lat <= north && lng >= west && lng <= east;
						});

						// Then apply decimation by zoom
						filteredPoints = filteredPoints.filter((_, index) => index % skipFactor === 0);
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
		],
		[
			officerPanelActive,
			officerLoading,
			officerList,
			dial112Visible,
			dial112Calls,
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
			categories,
			categoryToggles,
			subcategoryToggles,
			categoryData,
			mapBounds,
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
					<Toggle
						checked={officerAutoRefresh}
						onCheckedChange={setOfficerAutoRefresh}
						variant="success"
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
								className={`w-full rounded-2xl border p-3 text-left transition ${
									isActive ? "border-emerald-400/60 bg-emerald-500/10" : "border-white/5 bg-black/20 hover:border-white/20"
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

	// Dial 112 heatmap data
	const dial112HeatmapData = {
		data: dial112AllCalls.map((call) => ({
			position: { lat: call.latitude, lng: call.longitude },
			weight: 1,
		})),
		visible: dial112HeatmapVisible,
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
		data: accidentAllRecords.map((record) => ({
			position: { lat: record.latitude, lng: record.longitude },
			weight: record.accidentCount || 1,
		})),
		visible: accidentHeatmapVisible,
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
					const isOfficersPanel = sectionId === "officers";
					setOfficerPanelActive(isOfficersPanel);
					// Fetch officers when panel is first opened if not already loaded
					if (isOfficersPanel && officerList.length === 0 && !officerLoading && fetchDutyOfficersRef.current) {
						fetchDutyOfficersRef.current();
					}
				}}
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
														className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
															categoryToggles[category.id] ? `border` : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
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
												<Toggle
													checked={categoryToggles[category.id] || false}
													onCheckedChange={(checked) => {
														setCategoryToggles((prev) => ({ ...prev, [category.id]: checked }));
														if (checked) {
															// Expand category when enabled
															const newExpanded = new Set(expandedCategories);
															newExpanded.add(category.id);
															setExpandedCategories(newExpanded);
														}
													}}
													variant="default"
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
																			className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
																				subcategoryToggles[category.id]?.[subcategory.id] ? `border` : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
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
																<Toggle
																	checked={subcategoryToggles[category.id]?.[subcategory.id] || false}
																	onCheckedChange={(checked) => {
																		setSubcategoryToggles((prev) => ({
																			...prev,
																			[category.id]: {
																				...prev[category.id],
																				[subcategory.id]: checked,
																			},
																		}));
																	}}
																	variant="default"
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
												className={`px-2 py-0.5 text-xs rounded-full transition-colors shrink-0 ${
													Object.values(processionsVisible).every((visible) => visible)
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
									<Toggle
										checked={Object.values(processionsVisible).every((visible) => visible)}
										onCheckedChange={(checked) => {
											const newVisibility: { [festivalName: string]: boolean } = {};
											processedProcessionRoutes.forEach((festival) => {
												newVisibility[festival.festivalName] = checked;
											});
											setProcessionsVisible(newVisibility);
										}}
										variant="default"
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
													className={`px-2 py-0.5 text-xs rounded-full transition-colors shrink-0 ${
														processionsVisible[festivalGroup.festivalName]
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
										<Toggle
											checked={processionsVisible[festivalGroup.festivalName] || false}
											onCheckedChange={(checked) => {
												setProcessionsVisible((prev) => ({
													...prev,
													[festivalGroup.festivalName]: checked,
												}));
											}}
											variant="default"
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
											className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
												kmlLayerVisible ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
											}`}
										>
											{kmlLayerVisible ? "ON" : "OFF"}
										</span>
									</div>
									<p className="text-xs text-gray-400 mt-0.5">Nashik Gramin boundaries (auto-fallback)</p>
								</div>
								<Toggle
									checked={kmlLayerVisible}
									onCheckedChange={handleKMLToggle}
									variant="success"
								/>
							</div>

							{/* GeoJSON Layer Toggle */}
							<div className="flex items-center justify-between cursor-pointer group">
								<div className="flex-1">
									<div className="flex items-center space-x-2">
										<span className="text-sm font-medium text-gray-200">🗺️ GeoJSON Layer</span>
										<span
											className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
												geoJsonLayerVisible ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
											}`}
										>
											{geoJsonLayerVisible ? "ON" : "OFF"}
										</span>
									</div>
									<p className="text-xs text-gray-400 mt-0.5">Alternative boundary display</p>
								</div>
								<Toggle
									checked={geoJsonLayerVisible}
									onCheckedChange={handleGeoJSONToggle}
									variant="default"
								/>
							</div>

							{/* Dial 112 Points Toggle */}
							<div className="flex items-center justify-between cursor-pointer group">
								<div className="flex-1">
									<div className="flex items-center space-x-2">
										<span className="text-sm font-medium text-gray-200">🚨 Dial 112 Points</span>
										<span
											className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
												dial112Visible ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
											}`}
										>
											{dial112Visible ? "ON" : "OFF"}
										</span>
										{dial112Loading && <div className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin"></div>}
									</div>
									<p className="text-xs text-gray-400 mt-0.5">Viewport-filtered markers ({dial112Calls.length} visible)</p>
								</div>
								<Toggle
									checked={dial112Visible}
									onCheckedChange={setDial112Visible}
									variant="warning"
								/>
							</div>

							{/* Dial 112 Heatmap Toggle */}
							<div className="flex items-center justify-between cursor-pointer group">
								<div className="flex-1">
									<div className="flex items-center space-x-2">
										<span className="text-sm font-medium text-gray-200">🔥 Dial 112 Heatmap</span>
										<span
											className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
												dial112HeatmapVisible ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
											}`}
										>
											{dial112HeatmapVisible ? "ON" : "OFF"}
										</span>
									</div>
									<p className="text-xs text-gray-400 mt-0.5">Density visualization ({dial112AllCalls.length} total)</p>
								</div>
								<Toggle
									checked={dial112HeatmapVisible}
									onCheckedChange={setDial112HeatmapVisible}
									variant="warning"
								/>
							</div>

							{/* Accident Points Toggle */}
							<div className="flex items-center justify-between cursor-pointer group">
								<div className="flex-1">
									<div className="flex items-center space-x-2">
										<span className="text-sm font-medium text-gray-200">🚗 Accident Points</span>
										<span
											className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
												accidentVisible ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
											}`}
										>
											{accidentVisible ? "ON" : "OFF"}
										</span>
										{accidentLoading && <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin"></div>}
									</div>
									<p className="text-xs text-gray-400 mt-0.5">Viewport-filtered markers ({accidentRecords.length} visible)</p>
								</div>
								<Toggle
									checked={accidentVisible}
									onCheckedChange={setAccidentVisible}
									variant="danger"
								/>
							</div>

							{/* Accident Heatmap Toggle */}
							<div className="flex items-center justify-between cursor-pointer group">
								<div className="flex-1">
									<div className="flex items-center space-x-2">
										<span className="text-sm font-medium text-gray-200">🔥 Accident Heatmap</span>
										<span
											className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
												accidentHeatmapVisible ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
											}`}
										>
											{accidentHeatmapVisible ? "ON" : "OFF"}
										</span>
									</div>
									<p className="text-xs text-gray-400 mt-0.5">Density visualization ({accidentAllRecords.length} total)</p>
								</div>
								<Toggle
									checked={accidentHeatmapVisible}
									onCheckedChange={setAccidentHeatmapVisible}
									variant="danger"
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
															className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
																categoryToggles[category.id] ? `border` : "bg-gray-700/50 text-gray-500 border border-gray-600/30"
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
													<Toggle
														checked={categoryToggles[category.id] || false}
														onCheckedChange={(checked) => {
															setCategoryToggles((prev) => ({ ...prev, [category.id]: checked }));
															if (checked) {
																// Expand category when enabled
																const newExpanded = new Set(expandedCategories);
																newExpanded.add(category.id);
																setExpandedCategories(newExpanded);
															}
														}}
														variant="default"
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
																				className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
																					subcategoryToggles[category.id]?.[subcategory.id]
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
																	<Toggle
																		checked={subcategoryToggles[category.id]?.[subcategory.id] || false}
																		onCheckedChange={(checked) => {
																			setSubcategoryToggles((prev) => ({
																				...prev,
																				[category.id]: {
																					...prev[category.id],
																					[subcategory.id]: checked,
																				},
																			}));
																		}}
																		variant="default"
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
							...(dial112HeatmapVisible ? dial112HeatmapData.data : []),
							...(accidentHeatmapVisible ? accidentHeatmapData.data : []),
							...(atmHeatmapVisible ? atmHeatmapData.data : []),
							...(bankHeatmapVisible ? bankHeatmapData.data : []),
							...(hospitalHeatmapVisible ? hospitalHeatmapData.data : []),
							...(policeHeatmapVisible ? policeHeatmapData.data : []),
						],
						visible: dial112HeatmapVisible || accidentHeatmapVisible || atmHeatmapVisible || bankHeatmapVisible || hospitalHeatmapVisible || policeHeatmapVisible,
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

							{/* Static AI Gap Analysis substitute */}
							<div className="mt-4 rounded-md border border-white/10 bg-black/40">
								<div className="px-4 py-2 text-sm font-semibold">🤖 AI Gap Analysis</div>
								<div className="px-4 pb-3 space-y-2 text-xs">
									<div className="flex items-center justify-between">
										<span>📹 CCTV Gaps</span>
										<span className="text-amber-400">22</span>
									</div>
									<div className="flex items-center justify-between">
										<span>🚔 Police Gaps</span>
										<span className="text-blue-400">22</span>
									</div>
									<div className="flex items-center justify-between">
										<span>🏧 ATM Gaps</span>
										<span className="text-green-300">22</span>
									</div>
									<div className="flex items-center justify-between">
										<span>🏥 Medical Gaps</span>
										<span className="text-emerald-300">22</span>
									</div>
								</div>
							</div>
						</div>
						<div className="p-4">
							<DrawerClose className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm bg-white/10 text-white">Close</DrawerClose>
						</div>
					</DrawerContent>
				</Drawer>
			</div>

			{/* Add the GooeyFilter for the liquid toggle effects */}
			<GooeyFilter />
		</>
	);
}
