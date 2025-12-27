/**
 * External API service for fetching data from RHTechnology endpoints
 */

// Base URL for the external API
const BASE_URL = "https://rhtechnology.in/nashik-gis/app.php";

// Category and subcategory types
export interface Subcategory {
	id: number;
	name: string;
	icon: string;
	count: number;
}

export interface Category {
	id: number;
	name: string;
	color: string;
	icon: string;
	count: number;
	subcategories: Subcategory[];
}

export interface CategoryResponse {
	success: boolean;
	categories: Category[];
}

// Types based on the API documentation
export interface CCTVLocation {
	id: string | number;
	name: string;
	location_name: string;
	latitude: string | number;
	longitude: string | number;
	address: string;
	location: string;
	camera_type: string;
	type: string;
	is_working: boolean;
	ward: string;
	installation_date: string;
}

export interface CCTVResponse {
	success: boolean;
	data: CCTVLocation[];
}

export interface PoliceStation {
	id: string | number;
	name: string;
	latitude: string | number;
	longitude: string | number;
	address: string;
	contact_number: string;
	phone: string;
	type: string;
	is_active: boolean;
	ward: string;
}

export interface PoliceStationResponse {
	success: boolean;
	data: PoliceStation[];
}

export interface MapDataPoint {
	id: number;
	user_id: number;
	category_id: number;
	subcategory_id: number;
	crime_number: string | null;
	name: string;
	description: string;
	latitude: string;
	longitude: string;
	accuracy: number;
	altitude: number;
	address: string;
	image_path: string | null;
	additional_info: string | null;
	status: string;
	created_at: string;
	updated_at: string;
	verified_by: string | number | null;
	verified_at: string | null;
	image_url: string | null;
	user_name: string | null;
	category_name: string;
	category_color: string;
}

export interface MapDataResponse {
	success: boolean;
	data_points: MapDataPoint[];
	crime_data?: unknown[];
	processions_routes?: unknown[];
}

export interface ProcessionRoute {
	id: number;
	user_id: number;
	police_station: string;
	village: string;
	village_id: number | null;
	festival_name: string;
	procession_number: string;
	start_point_lat: string;
	start_point_lng: string;
	end_point_lat: string;
	end_point_lng: string;
	start_address: string;
	end_address: string;
	route_coordinates: string; // JSON string
	total_distance: number;
	start_time: string | null;
	end_time: string | null;
	duration_minutes: number | null;
	expected_crowd: number | null;
	description: string;
	created_at: string;
	status: string;
	verified_at: string | null;
	verified_by: string | null;
}

export interface ProcessionRoutesResponse {
	success: boolean;
	routes: ProcessionRoute[];
	count?: number;
	categorized?: Record<string, ProcessionRoute[]>;
}

export interface Hospital {
	id: string | number;
	name: string;
	hospital_name: string;
	latitude: string | number;
	longitude: string | number;
	address: string;
	contact_number: string;
	phone: string;
	type: string;
	specialties: string;
	is_active: boolean;
	ward: string;
}

export interface HospitalResponse {
	success: boolean;
	data: Hospital[];
}

export interface ATMLocation {
	id: string | number;
	bank_name: string;
	name: string;
	latitude: string | number;
	longitude: string | number;
	address: string;
	is_working: boolean;
	ward: string;
}

export interface ATMResponse {
	success: boolean;
	data: ATMLocation[];
}

export interface BankLocation {
	id: string | number;
	bank_name: string;
	name: string;
	branch_name: string;
	branch: string;
	latitude: string | number;
	longitude: string | number;
	address: string;
	ifsc_code: string;
	ifsc: string;
	contact_number: string;
	phone: string;
	is_active: boolean;
	ward: string;
}

export interface BankResponse {
	success: boolean;
	data: BankLocation[];
}

// Dial 112
export interface Dial112Call {
	id: string;
	eventId: string;
	policeStation: string;
	callType: string;
	latitude: number;
	longitude: number;
	receivedAt: string;
}

export interface Dial112Response {
	success: boolean;
	data: Dial112Call[];
}

export type Dial112SSEHandler = (row: Dial112Call) => void;
export type Dial112SSEDone = () => void;

// Accident Data
export interface AccidentRecord {
	srNo: string;
	state: string;
	district: string;
	latitude: number;
	longitude: number;
	gridId: string;
	accidentCount: number;
	allIndiaRank: number;
	ambulance: string;
}

export type AccidentSSEHandler = (row: AccidentRecord) => void;
export type AccidentSSEDone = () => void;

export function streamDial112Calls(onRow: Dial112SSEHandler, onDone?: Dial112SSEDone): () => void {
	const es = new EventSource("/api/dial112/stream");
	const rowListener = (ev: MessageEvent<string>) => {
		try {
			const row: Dial112Call = JSON.parse(ev.data as string);
			onRow(row);
		} catch {
			// ignore malformed rows
		}
	};
	const doneListener = () => {
		onDone?.();
		es.close();
	};
	es.addEventListener("row", rowListener as unknown as EventListener);
	es.addEventListener("done", doneListener as unknown as EventListener);
	es.onerror = () => {
		es.close();
	};
	return () => {
		es.removeEventListener("row", rowListener as unknown as EventListener);
		es.removeEventListener("done", doneListener as unknown as EventListener);
		es.close();
	};
}

export function streamAccidentData(onRow: AccidentSSEHandler, onDone?: AccidentSSEDone): () => void {
	const es = new EventSource("/api/accidents/stream");
	const rowListener = (ev: MessageEvent<string>) => {
		try {
			const row: AccidentRecord = JSON.parse(ev.data as string);
			onRow(row);
		} catch {
			// ignore malformed rows
		}
	};
	const doneListener = () => {
		onDone?.();
		es.close();
	};
	es.addEventListener("row", rowListener as unknown as EventListener);
	es.addEventListener("done", doneListener as unknown as EventListener);
	es.onerror = () => {
		es.close();
	};
	return () => {
		es.removeEventListener("row", rowListener as unknown as EventListener);
		es.removeEventListener("done", doneListener as unknown as EventListener);
		es.close();
	};
}

/**
 * Fetch CCTV locations from the external API
 */
export async function fetchCCTVLocations(): Promise<CCTVLocation[]> {
	try {
		console.log("🎥 Fetching CCTV locations from external API...");

		const response = await fetch(`${BASE_URL}?endpoint=get-cctv-locations`, {
			method: "GET",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data: CCTVResponse = await response.json();

		if (!data.success) {
			throw new Error("API returned success: false");
		}

		console.log(`✅ Fetched ${data.data.length} CCTV locations`);

		// Transform coordinates to numbers and validate data
		const validLocations = data.data
			.filter((location) => {
				const lat = typeof location.latitude === "string" ? parseFloat(location.latitude) : location.latitude;
				const lng = typeof location.longitude === "string" ? parseFloat(location.longitude) : location.longitude;

				return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
			})
			.map((location) => ({
				...location,
				latitude: typeof location.latitude === "string" ? parseFloat(location.latitude) : location.latitude,
				longitude: typeof location.longitude === "string" ? parseFloat(location.longitude) : location.longitude,
			}));

		console.log(`📍 Valid CCTV locations: ${validLocations.length}/${data.data.length}`);

		return validLocations;
	} catch (error) {
		console.error("❌ Error fetching CCTV locations:", error);
		throw error;
	}
}

/**
 * Fetch police station locations from the external API
 */
export async function fetchPoliceStations(): Promise<PoliceStation[]> {
	try {
		console.log("🚔 Fetching police stations from external API...");

		const response = await fetch(`${BASE_URL}?endpoint=get-police-stations`, {
			method: "GET",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const raw: unknown = await response.json();
		// Accept a few possible shapes defensively
		type Possible = PoliceStationResponse & { items?: PoliceStation[]; stations?: PoliceStation[] };
		const obj = raw as Possible;
		const list: PoliceStation[] = Array.isArray(obj.data) ? obj.data : Array.isArray(obj.items) ? obj.items : Array.isArray(obj.stations) ? obj.stations : [];

		if (obj.success === false) {
			console.warn("⚠️ Police stations API returned success=false; proceeding with empty list");
		}

		console.log(`✅ Fetched ${list.length} police stations (raw)`);

		// Transform coordinates to numbers and validate data
		const validStations = list
			.filter((station) => {
				const lat = typeof station.latitude === "string" ? parseFloat(station.latitude) : station.latitude;
				const lng = typeof station.longitude === "string" ? parseFloat(station.longitude) : station.longitude;

				return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
			})
			.map((station) => ({
				...station,
				latitude: typeof station.latitude === "string" ? parseFloat(station.latitude) : station.latitude,
				longitude: typeof station.longitude === "string" ? parseFloat(station.longitude) : station.longitude,
			}));

		console.log(`📍 Valid police stations: ${validStations.length}/${list.length}`);

		return validStations;
	} catch (error) {
		console.error("❌ Error fetching police stations:", error);
		throw error;
	}
}

/**
 * Fetch hospital locations from the external API
 */
export async function fetchHospitals(): Promise<Hospital[]> {
	try {
		console.log("🏥 Fetching hospitals from external API...");

		const response = await fetch(`${BASE_URL}?endpoint=get-hospitals`, {
			method: "GET",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data: HospitalResponse = await response.json();

		if (!data.success) {
			throw new Error("API returned success: false");
		}

		console.log(`✅ Fetched ${data.data.length} hospitals`);

		// Transform coordinates to numbers and validate data
		const validHospitals = data.data
			.filter((hospital) => {
				const lat = typeof hospital.latitude === "string" ? parseFloat(hospital.latitude) : hospital.latitude;
				const lng = typeof hospital.longitude === "string" ? parseFloat(hospital.longitude) : hospital.longitude;

				return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
			})
			.map((hospital) => ({
				...hospital,
				latitude: typeof hospital.latitude === "string" ? parseFloat(hospital.latitude) : hospital.latitude,
				longitude: typeof hospital.longitude === "string" ? parseFloat(hospital.longitude) : hospital.longitude,
			}));

		console.log(`📍 Valid hospitals: ${validHospitals.length}/${data.data.length}`);

		return validHospitals;
	} catch (error) {
		console.error("❌ Error fetching hospitals:", error);
		throw error;
	}
}

/**
 * Fetch ATM locations from the external API
 */
export async function fetchATMLocations(): Promise<ATMLocation[]> {
	try {
		console.log("🏧 Fetching ATM locations from external API...");

		const response = await fetch(`${BASE_URL}?endpoint=get-atm-locations`, {
			method: "GET",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data: ATMResponse = await response.json();

		if (!data.success) {
			throw new Error("API returned success: false");
		}

		console.log(`✅ Fetched ${data.data.length} ATM locations`);

		// Transform coordinates to numbers and validate data
		const validATMs = data.data
			.filter((atm) => {
				const lat = typeof atm.latitude === "string" ? parseFloat(atm.latitude) : atm.latitude;
				const lng = typeof atm.longitude === "string" ? parseFloat(atm.longitude) : atm.longitude;

				return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
			})
			.map((atm) => ({
				...atm,
				latitude: typeof atm.latitude === "string" ? parseFloat(atm.latitude) : atm.latitude,
				longitude: typeof atm.longitude === "string" ? parseFloat(atm.longitude) : atm.longitude,
			}));

		console.log(`📍 Valid ATM locations: ${validATMs.length}/${data.data.length}`);

		return validATMs;
	} catch (error) {
		console.error("❌ Error fetching ATM locations:", error);
		throw error;
	}
}

/**
 * Fetch bank locations from the external API
 */
export async function fetchBankLocations(): Promise<BankLocation[]> {
	try {
		console.log("🏦 Fetching bank locations from external API...");

		const response = await fetch(`${BASE_URL}?endpoint=get-bank-locations`, {
			method: "GET",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data: BankResponse = await response.json();

		if (!data.success) {
			throw new Error("API returned success: false");
		}

		console.log(`✅ Fetched ${data.data.length} bank locations`);

		// Transform coordinates to numbers and validate data
		const validBanks = data.data
			.filter((bank) => {
				const lat = typeof bank.latitude === "string" ? parseFloat(bank.latitude) : bank.latitude;
				const lng = typeof bank.longitude === "string" ? parseFloat(bank.longitude) : bank.longitude;

				return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
			})
			.map((bank) => ({
				...bank,
				latitude: typeof bank.latitude === "string" ? parseFloat(bank.latitude) : bank.latitude,
				longitude: typeof bank.longitude === "string" ? parseFloat(bank.longitude) : bank.longitude,
			}));

		console.log(`📍 Valid bank locations: ${validBanks.length}/${data.data.length}`);

		return validBanks;
	} catch (error) {
		console.error("❌ Error fetching bank locations:", error);
		throw error;
	}
}

/**
 * Fetch Dial 112 calls parsed from local CSV (API route)
 */
export async function fetchDial112Calls(): Promise<Dial112Call[]> {
	try {
		console.log("🚨 Fetching Dial 112 calls (CSV via API route)...");
		const response = await fetch("/api/dial112", { cache: "no-store" });
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		const json: Dial112Response = await response.json();
		if (!json.success) throw new Error("Dial112 API returned success=false");
		const calls = json.data.filter((c) => Number.isFinite(c.latitude) && Number.isFinite(c.longitude));
		console.log(`✅ Loaded ${calls.length} Dial 112 calls`);
		return calls;
	} catch (error) {
		console.error("❌ Error fetching Dial 112 calls:", error);
		return [];
	}
}

/**
 * Fetch accident records parsed from local CSV (API route)
 */
export async function fetchAccidentRecords(): Promise<AccidentRecord[]> {
	try {
		console.log("🚗 Fetching accident records (CSV via API route)...");
		const response = await fetch("/api/accidents", { cache: "no-store" });
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		const json: { success: boolean; data: AccidentRecord[] } = await response.json();
		if (!json.success) throw new Error("Accidents API returned success=false");
		const records = json.data.filter((r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude));
		console.log(`✅ Loaded ${records.length} accident records`);
		return records;
	} catch (error) {
		console.error("❌ Error fetching accident records:", error);
		return [];
	}
}

/**
 * Fetch map data from the external API
 */
export async function fetchMapData(): Promise<MapDataResponse> {
	try {
		console.log("🗺️ Fetching map data from external API...");

		const response = await fetch(`${BASE_URL}?endpoint=get-map-data`, {
			method: "GET",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data: MapDataResponse = await response.json();

		if (!data.success) {
			throw new Error("API returned success: false");
		}

		console.log(`✅ Fetched ${data.data_points.length} map data points`);

		return data;
	} catch (error) {
		console.error("❌ Error fetching map data:", error);
		throw error;
	}
}

/**
 * Fetch procession routes from the external API
 */
export async function fetchProcessionRoutes(): Promise<ProcessionRoute[]> {
	try {
		console.log("🛤️ Fetching procession routes from external API...");

		const response = await fetch(`${BASE_URL}?endpoint=get-procession-routes`, {
			method: "GET",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data: ProcessionRoutesResponse = await response.json();

		if (!data.success) {
			throw new Error("API returned success: false");
		}

		console.log(`✅ Fetched ${data.routes.length} procession routes`);

		// Parse route coordinates and validate data
		const validRoutes = data.routes
			.filter((route) => {
				try {
					const coords = JSON.parse(route.route_coordinates);
					return Array.isArray(coords) && coords.length > 0;
				} catch {
					return false;
				}
			})
			.map((route) => ({
				...route,
				// Keep coordinates as strings to match interface
			}));

		console.log(`📍 Valid procession routes: ${validRoutes.length}/${data.routes.length}`);

		return validRoutes;
	} catch (error) {
		console.error("❌ Error fetching procession routes:", error);
		throw error;
	}
}

/**
 * Fetch categories with subcategories from the external API
 */
export async function fetchCategories(): Promise<Category[]> {
	try {
		console.log("📂 Fetching categories from external API...");

		const response = await fetch(`${BASE_URL}?endpoint=get-categories-with-subcategories`, {
			method: "GET",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data: CategoryResponse = await response.json();

		if (!data.success) {
			throw new Error("API returned success: false");
		}

		console.log(`✅ Fetched ${data.categories.length} categories`);

		return data.categories;
	} catch (error) {
		console.error("❌ Error fetching categories:", error);
		throw error;
	}
}

/**
 * Fetch map data points for a specific category and optional subcategory
 */
export async function fetchCategoryPoints(categoryId: number, subcategoryId?: number): Promise<MapDataPoint[]> {
	try {
		console.log(`📊 Fetching data for category ${categoryId}${subcategoryId ? `, subcategory ${subcategoryId}` : ""}...`);

		let endpoint = `${BASE_URL}?endpoint=get-map-data&category_id=${categoryId}&limit=10000`;
		if (subcategoryId) {
			endpoint += `&subcategory_id=${subcategoryId}`;
		}

		const response = await fetch(endpoint, {
			method: "GET",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data: MapDataResponse = await response.json();

		if (!data.success) {
			throw new Error("API returned success: false");
		}

		console.log(`✅ Fetched ${data.data_points.length} data points for category ${categoryId}${subcategoryId ? `, subcategory ${subcategoryId}` : ""}`);

		// Filter data points by category_id and subcategory_id to ensure accuracy
		let filteredPoints = data.data_points.filter((point: MapDataPoint) => point.category_id === categoryId || point.category_id === parseInt(categoryId.toString()));

		if (subcategoryId) {
			filteredPoints = filteredPoints.filter((point: MapDataPoint) => point.subcategory_id === subcategoryId || point.subcategory_id === parseInt(subcategoryId.toString()));
		}

		return filteredPoints;
	} catch (error) {
		console.error(`❌ Error fetching category data:`, error);
		throw error;
	}
}
