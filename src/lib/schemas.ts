import { z } from "zod";

// Base response schema
const BaseResponseSchema = z.object({
	success: z.boolean(),
});

// Common field schemas
const CoordinateSchema = z.union([z.string(), z.number()]);
const IdSchema = z.union([z.string(), z.number()]);

// 1. Main Map Data Schema
export const MapDataPointSchema = z.object({
	id: z.number(),
	user_id: z.number(),
	category_id: z.number(),
	subcategory_id: z.number(),
	crime_number: z.string().nullable(),
	name: z.string(),
	description: z.string(),
	latitude: z.string(), // Always string in actual data
	longitude: z.string(), // Always string in actual data
	accuracy: z.number(),
	altitude: z.number(),
	address: z.string(),
	image_path: z.string().nullable(),
	additional_info: z.string().nullable(),
	status: z.string(),
	created_at: z.string(),
	updated_at: z.string(),
	verified_by: z.union([z.string(), z.number()]).nullable(),
	verified_at: z.string().nullable(),
	image_url: z.string().nullable(),
	user_name: z.string().nullable(),
	category_name: z.string(),
	category_color: z.string(),
});

export const MapDataResponseSchema = BaseResponseSchema.extend({
	data_points: z.array(MapDataPointSchema),
	crime_data: z.array(z.any()).optional(),
	processions_routes: z.array(z.any()).optional(),
});

// 2. Categories Schema
export const SubcategorySchema = z.object({
	id: z.number(),
	name: z.string(),
	icon: z.string(),
	count: z.number(),
});

export const CategorySchema = z.object({
	id: z.number(),
	name: z.string(),
	color: z.string(),
	icon: z.string(),
	subcategories: z.array(SubcategorySchema),
	count: z.number(),
});

export const CategoriesResponseSchema = BaseResponseSchema.extend({
	categories: z.array(CategorySchema),
});

// 3. Hospital Schema
export const HospitalSchema = z.object({
	id: z.number(),
	hospital_name: z.string(),
	latitude: z.number(),
	longitude: z.number(),
	location: z.string(),
	is_active: z.number(),
});

export const HospitalsResponseSchema = BaseResponseSchema.extend({
	data: z.array(HospitalSchema),
});

// 4. CCTV Schema
export const CTVSchema = z.object({
	id: z.number(),
	name: z.string(),
	latitude: z.number(),
	longitude: z.number(),
	location: z.string(),
	is_active: z.number(),
});

export const CTVResponseSchema = BaseResponseSchema.extend({
	data: z.array(CTVSchema),
});

// 5. ATM Schema
export const ATMSchema = z.object({
	id: z.number(),
	bank_name: z.string(),
	latitude: z.number(),
	longitude: z.number(),
	location: z.string(),
	is_active: z.number(),
});

export const ATMResponseSchema = BaseResponseSchema.extend({
	data: z.array(ATMSchema),
});

// 6. Bank Schema
export const BankSchema = z.object({
	id: z.number(),
	bank_name: z.string(),
	latitude: z.string(),
	longitude: z.string(),
	location: z.string(),
	address: z.string(),
	subcategory_name: z.string(),
	category_name: z.string(),
	status: z.string(),
	created_at: z.string(),
	is_active: z.number(),
});

export const BankResponseSchema = BaseResponseSchema.extend({
	data: z.array(BankSchema),
});

// 7. Police Station Schema
export const PoliceStationSchema = z.object({
	id: z.number(),
	name: z.string(),
	latitude: z.number(),
	longitude: z.number(),
	address: z.string(),
	contact_number: z.string(),
	phone: z.string(),
	type: z.string(),
	is_active: z.number(),
	ward: z.string(),
});

// Police stations endpoint returns wrapped response object with 'stations' field
export const PoliceStationResponseSchema = BaseResponseSchema.extend({
	stations: z.array(
		z.object({
			id: z.number(),
			station_name: z.string(),
			station_name_marathi: z.string().optional(),
		}),
	),
});

// 8. Procession Routes Schema
export const ProcessionRouteSchema = z.object({
	id: z.number(),
	user_id: z.number(),
	police_station: z.string(),
	village: z.string(),
	village_id: z.number().nullable(),
	festival_name: z.string(),
	procession_number: z.string(),
	start_point_lat: z.string(),
	start_point_lng: z.string(),
	end_point_lat: z.string(),
	end_point_lng: z.string(),
	start_address: z.string(),
	end_address: z.string(),
	route_coordinates: z.string(),
	total_distance: z.number(),
	start_time: z.string().nullable(),
	end_time: z.string().nullable(),
	duration_minutes: z.number().nullable(),
	expected_crowd: z.number().nullable(),
	description: z.string(),
	created_at: z.string(),
	status: z.string(),
	verified_at: z.string().nullable(),
	verified_by: z.string().nullable(),
});

// Procession routes endpoint returns wrapped response object
export const ProcessionRoutesResponseSchema = BaseResponseSchema.extend({
	routes: z.array(ProcessionRouteSchema),
	count: z.number().optional(),
	categorized: z.record(z.string(), z.array(ProcessionRouteSchema)).optional(),
});

// 8.1. Route Gap Analysis Schema
export const GapAnalysisItemSchema = z.object({
	festival: z.any(),
	total_routes: z.number(),
	covered_police_stations: z.array(z.string()),
	uncovered_police_stations: z.array(z.string()),
	covered_villages: z.array(z.string()),
	uncovered_villages: z.array(z.string()),
	coverage_percentage: z.object({
		police_stations: z.number(),
		villages: z.number(),
	}),
});

export const RouteGapAnalysisResponseSchema = BaseResponseSchema.extend({
	gap_analysis: z.array(GapAnalysisItemSchema).optional(),
	summary: z
		.object({
			total_festivals: z.number(),
			total_police_stations: z.number(),
			total_villages: z.number(),
			total_routes: z.number(),
		})
		.optional(),
	message: z.string().optional(),
	error: z.string().optional(),
});

// 8.2. Festival Schema
export const FestivalSchema = z.object({
	id: z.number(),
	name: z.string(),
	category: z.string().optional(),
	description: z.string().optional(),
	start_date: z.string().optional(),
	end_date: z.string().optional(),
	is_active: z.boolean().optional(),
	created_at: z.string().optional(),
});

export const FestivalsResponseSchema = BaseResponseSchema.extend({
	festivals: z.array(FestivalSchema),
});

// 9. Crime Data Schema
export const CrimeDataSchema = z.object({
	id: IdSchema,
	category: z.string(),
	category_name: z.string(),
	description: z.string(),
	name: z.string(),
	latitude: CoordinateSchema,
	longitude: CoordinateSchema,
	address: z.string(),
	ward: z.string(),
	status: z.string(),
	user_name: z.string(),
	category_color: z.string(),
	image_url: z.string(),
	crime_number: z.string(),
	created_at: z.string(),
});

export const CrimeDataResponseSchema = BaseResponseSchema.extend({
	data: z.array(CrimeDataSchema).optional(),
});

// 10. Emergency Data Schema
export const EmergencyDataSchema = z.object({
	id: IdSchema,
	name: z.string(),
	description: z.string(),
	type: z.string(),
	latitude: CoordinateSchema,
	longitude: CoordinateSchema,
	address: z.string(),
	contact_number: z.string(),
	phone: z.string(),
	is_active: z.boolean(),
	ward: z.string(),
});

export const EmergencyDataResponseSchema = BaseResponseSchema.extend({
	data: z.array(EmergencyDataSchema).optional(),
});

// 11. AI Traffic Monitor Schema
export const TrafficNodeSchema = z.object({
	id: z.number(),
	node_id: z.string(),
	name: z.string(),
	latitude: z.string(),
	longitude: z.string(),
	node_type: z.string(),
	capacity: z.number(),
	is_active: z.number(),
	created_at: z.string(),
});

export const TrafficAlertSchema = z.object({
	id: z.string(),
	type: z.string(),
	severity: z.string(),
	node: z.any(),
	data: z.object({
		congestionLevel: z.number(),
		averageSpeed: z.number(),
		vehicleCount: z.number(),
	}),
	message: z.string(),
	recommendations: z.array(z.any()),
	timestamp: z.string(),
});

export const AITrafficMonitorResponseSchema = BaseResponseSchema.extend({
	nodes: z.array(TrafficNodeSchema),
	alerts: z.array(TrafficAlertSchema),
	predictions: z.any(),
	timestamp: z.string(),
});

// 12. Accident CSV Schema
export const AccidentCSVSchema = z.object({
	latitude: z.number().optional(),
	longitude: z.number().optional(),
	description: z.string().optional(),
	date: z.string().optional(),
	severity: z.number().optional(),
});

export const AccidentCSVResponseSchema = BaseResponseSchema.extend({
	items: z.array(AccidentCSVSchema).optional(),
	error: z.string().optional(),
});

// 13. Health Check Schema
export const HealthCheckResponseSchema = BaseResponseSchema.extend({
	message: z.string(),
});

// 14. User Management Schemas
export const UserSchema = z.object({
	id: z.number(),
	name: z.string(),
	email: z.string(),
	phone: z.string(),
	role: z.string(),
	police_station: z.string(),
});

export const LoginResponseSchema = BaseResponseSchema.extend({
	message: z.string(),
	user: UserSchema,
	user_id: z.number(),
});

export const RegisterResponseSchema = BaseResponseSchema.extend({
	message: z.string(),
	user_id: z.number(),
});

// 15. GIS Features Schema
export const GISFeatureSchema = z.object({
	id: z.number(),
	name: z.string(),
	description: z.string(),
	latitude: z.number(),
	longitude: z.number(),
	category_name: z.string(),
	category_color: z.string(),
	address: z.string(),
	created_at: z.string(),
	status: z.string(),
});

export const GISFeaturesResponseSchema = BaseResponseSchema.extend({
	features: z.array(GISFeatureSchema),
});

// 16. Dashboard Stats Schema
export const DashboardStatsSchema = z.object({
	total_data_points: z.number(),
	total_crimes: z.number(),
	total_routes: z.number(),
	active_users: z.number(),
	recent_activity: z.array(z.any()),
});

export const DashboardStatsResponseSchema = BaseResponseSchema.extend({
	stats: DashboardStatsSchema.optional(),
});

// Endpoint configuration
export const ENDPOINT_CONFIGS = [
	{
		name: "Main Map Data",
		endpoint: "get-map-data",
		schema: MapDataResponseSchema,
		description: "Main map data with crime incidents, police stations, etc.",
	},
	{
		name: "Categories",
		endpoint: "get-categories-with-subcategories",
		schema: CategoriesResponseSchema,
		description: "Categories and subcategories for data classification",
	},
	{
		name: "Hospitals",
		endpoint: "get-hospitals",
		schema: HospitalsResponseSchema,
		description: "Hospital locations and contact information",
	},
	{
		name: "CCTV Locations",
		endpoint: "get-cctv-locations",
		schema: CTVResponseSchema,
		description: "CCTV camera locations and status",
	},
	{
		name: "ATM Locations",
		endpoint: "get-atm-locations",
		schema: ATMResponseSchema,
		description: "ATM locations and working status",
	},
	{
		name: "Bank Locations",
		endpoint: "get-bank-locations",
		schema: BankResponseSchema,
		description: "Bank branch locations and details",
	},
	{
		name: "Police Stations",
		endpoint: "get-map-data",
		schema: MapDataResponseSchema,
		description: "Police station locations and contact info (filtered from map data)",
	},
	{
		name: "Procession Routes",
		endpoint: "get-procession-routes",
		schema: ProcessionRoutesResponseSchema,
		description: "Festival procession routes and waypoints",
	},
	{
		name: "Route Gap Analysis",
		endpoint: "get-route-gap-analysis",
		schema: RouteGapAnalysisResponseSchema,
		description: "Analyzes route coverage and identifies gaps",
	},
	{
		name: "Festivals",
		endpoint: "get-festivals",
		schema: FestivalsResponseSchema,
		description: "Festival data and categories",
	},
	{
		name: "Crime Data",
		endpoint: "get-crime-data",
		schema: CrimeDataResponseSchema,
		description: "Crime incident data and locations",
	},
	{
		name: "Emergency Data",
		endpoint: "get-emergency-data",
		schema: EmergencyDataResponseSchema,
		description: "Emergency service locations and contacts",
	},
	{
		name: "AI Traffic Monitor",
		endpoint: "ai-traffic-monitor",
		schema: AITrafficMonitorResponseSchema,
		description: "AI-powered traffic monitoring and alerts",
	},
	{
		name: "Accident CSV Data",
		endpoint: "get-accident-csv",
		schema: AccidentCSVResponseSchema,
		description: "Accident data from CSV files",
	},
	{
		name: "Health Check",
		endpoint: "health-check",
		schema: HealthCheckResponseSchema,
		description: "API health status check",
	},
	{
		name: "GIS Features",
		endpoint: "get-gis-features",
		schema: GISFeaturesResponseSchema,
		description: "GIS features and data points",
	},
	{
		name: "Dashboard Stats",
		endpoint: "dashboard-stats",
		schema: DashboardStatsResponseSchema,
		description: "Dashboard statistics and metrics",
	},
] as const;

export type EndpointConfig = (typeof ENDPOINT_CONFIGS)[number];
