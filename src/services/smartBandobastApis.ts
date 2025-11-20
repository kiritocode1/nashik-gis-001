/**
 * Smart Bandobast API service for fetching data from backend endpoints
 */

// Base URL for the API
const BASE_URL = "https://backend.smartbandobast.in/api";

// Helper function to get auth headers
function getAuthHeaders(token?: string): HeadersInit {
	const headers: HeadersInit = {
		Accept: "application/json",
		"Content-Type": "application/json",
	};
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}
	return headers;
}

// ============================================================================
// TYPES - Authentication
// ============================================================================

export interface RegisterRequest {
	sevarthId: string;
	password: string;
	name: string;
	mobile: string;
	role?: "admin" | "sub_admin" | "police" | "sp" | "special_branch";
	psId?: string;
	rank?: string;
	badgeNumber?: string;
	otp?: string;
}

export interface RegisterResponse {
	_id: string;
	sevarthId: string;
	name: string;
	mobile: string;
	role: string;
}

export interface LoginRequest {
	sevarthId: string;
	password: string;
}

export interface LoginResponse {
	authorised: number;
	msg: string;
	token?: string;
	role?: string;
	user?: {
		id: string;
		name: string;
		sevarthId: string;
		role: string;
		psId?: string;
		rank?: string;
		badgeNumber?: string;
	};
	sdpo?: {
		id: string;
		name: string;
		email: string;
		contact_no: string;
		office_address: string;
	};
}

export interface SendOTPRequest {
	sevarthId: string;
}

export interface SendOTPResponse {
	success: boolean;
	msg: string;
	msgEn: string;
	maskedMobile: string;
}

export interface VerifyOTPRequest {
	sevarthId: string;
	otp: string;
}

export interface VerifyOTPResponse {
	success: boolean;
	msg: string;
	msgEn: string;
	token: string;
	user: {
		id: string;
		sevarthId: string;
		name: string;
		mobile: string;
		role: string;
		rank?: string;
		badgeNumber?: string;
		designation?: string;
		policeStation?: {
			id: string;
			name: string;
			address: string;
		} | null;
	};
}

export interface UserProfile {
	_id: string;
	sevarthId: string;
	name: string;
	role: string;
	mobile?: string;
	psId?: string;
	rank?: string;
	badgeNumber?: string;
	designation?: string;
}

export interface PoliceUser {
	_id: string;
	name: string;
}

export interface LogoutResponse {
	msg: string;
}

// ============================================================================
// TYPES - Events
// ============================================================================

export interface User {
	_id: string;
	sevarthId: string;
	name: string;
	role: string;
	psId?: string;
	rank?: string;
	badgeNumber?: string;
}

export interface Event {
	_id: string;
	name: string;
	description?: string;
	date: string;
	endDate?: string;
	location: string;
	createdBy: string;
	officers: string[];
	status: "pending" | "approved" | "rejected";
	planningStatus?: "planning" | "planned" | "in_progress" | "completed";
	approvedAt?: string;
	approvedBy?: string;
	approvalComments?: string;
	rejectedAt?: string;
	rejectedBy?: string;
	rejectionReason?: string;
	rejectionComments?: string;
	officerRequirements?: Record<
		string,
		{
			male: number;
			female: number;
			total: number;
		}
	>;
	totalManpowerRequired?: number;
	assignedOfficers?: Array<{
		officerId: string;
		rank: string;
		gender: "male" | "female";
		location?: string;
		assignedBy: string;
		assignedAt: string;
		status: "assigned" | "confirmed" | "absent";
	}>;
	planningUpdatedAt?: string;
	planningUpdatedBy?: string;
	planningComments?: string;
	planningOfficers?: string[];
	createdAt: string;
	updatedAt: string;
}

export interface CreateEventRequest {
	name: string;
	description?: string;
	date: string;
	endDate?: string;
	location?: string;
	officers?: string[];
}

export interface CreateEventResponse {
	msg: string;
	event: Event;
}

export interface GetEventsQueryParams {
	name?: string;
	location?: string;
	dateFrom?: string;
	dateTo?: string;
}

export interface EventWithRelations {
	_id: string;
	name: string;
	description?: string;
	date: string;
	endDate?: string;
	location: string;
	createdBy: User;
	officers: User[];
	status: "pending" | "approved" | "rejected";
	planningStatus?: "planning" | "planned" | "in_progress" | "completed";
	approvedAt?: string;
	approvedBy?: string;
	approvalComments?: string;
	rejectedAt?: string;
	rejectedBy?: string;
	rejectionReason?: string;
	rejectionComments?: string;
	officerRequirements?: Record<
		string,
		{
			male: number;
			female: number;
			total: number;
		}
	>;
	totalManpowerRequired?: number;
	assignedOfficers?: Array<{
		officerId: string;
		rank: string;
		gender: "male" | "female";
		location?: string;
		assignedBy: string;
		assignedAt: string;
		status: "assigned" | "confirmed" | "absent";
	}>;
	planningUpdatedAt?: string;
	planningUpdatedBy?: string;
	planningComments?: string;
	planningOfficers?: string[];
	createdAt: string;
	updatedAt: string;
}

export interface UpdateEventRequest {
	name?: string;
	description?: string;
	date?: string;
	endDate?: string;
	location?: string;
	officers?: string[];
}

export interface DeleteEventResponse {
	msg: string;
}

export interface ApproveEventRequest {
	comments?: string;
	assignedOfficers?: string[];
}

export interface ApproveEventResponse {
	msg: string;
	event: Event;
}

// ============================================================================
// AUTHENTICATION FUNCTIONS
// ============================================================================

/**
 * Register a new user
 */
export async function registerUser(data: RegisterRequest): Promise<RegisterResponse> {
	try {
		const response = await fetch(`${BASE_URL}/auth/register`, {
			method: "POST",
			headers: getAuthHeaders(),
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: RegisterResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error registering user:", error);
		throw error;
	}
}

/**
 * Login with credentials
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
	try {
		const response = await fetch(`${BASE_URL}/auth/login`, {
			method: "POST",
			headers: getAuthHeaders(),
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: LoginResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error logging in:", error);
		throw error;
	}
}

/**
 * Send OTP to registered mobile number
 */
export async function sendOTP(data: SendOTPRequest): Promise<SendOTPResponse> {
	try {
		const response = await fetch(`${BASE_URL}/auth/send-otp`, {
			method: "POST",
			headers: getAuthHeaders(),
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: SendOTPResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error sending OTP:", error);
		throw error;
	}
}

/**
 * Verify OTP and get JWT token
 */
export async function verifyOTP(data: VerifyOTPRequest): Promise<VerifyOTPResponse> {
	try {
		const response = await fetch(`${BASE_URL}/auth/verify-otp`, {
			method: "POST",
			headers: getAuthHeaders(),
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: VerifyOTPResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error verifying OTP:", error);
		throw error;
	}
}

/**
 * Get current user profile. Requires Auth
 */
export async function getCurrentUser(token: string): Promise<UserProfile> {
	try {
		const response = await fetch(`${BASE_URL}/auth/me`, {
			method: "GET",
			headers: getAuthHeaders(token),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: UserProfile = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching current user:", error);
		throw error;
	}
}

/**
 * Get list of all police users
 */
export async function getPoliceUsers(): Promise<PoliceUser[]> {
	try {
		const response = await fetch(`${BASE_URL}/auth/list`, {
			method: "GET",
			headers: getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: PoliceUser[] = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching police users:", error);
		throw error;
	}
}

/**
 * Logout (placeholder)
 */
export async function logout(token: string): Promise<LogoutResponse> {
	try {
		const response = await fetch(`${BASE_URL}/auth/logout`, {
			method: "POST",
			headers: getAuthHeaders(token),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: LogoutResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error logging out:", error);
		throw error;
	}
}

// ============================================================================
// EVENTS FUNCTIONS
// ============================================================================

/**
 * Create a new event. Requires Auth
 */
export async function createEvent(data: CreateEventRequest, token: string): Promise<CreateEventResponse> {
	try {
		const response = await fetch(`${BASE_URL}/events`, {
			method: "POST",
			headers: getAuthHeaders(token),
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: CreateEventResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error creating event:", error);
		throw error;
	}
}

/**
 * Get all events with filtering. Requires Auth
 */
export async function getEvents(params?: GetEventsQueryParams, token?: string): Promise<EventWithRelations[]> {
	try {
		const queryParams = new URLSearchParams();
		if (params?.name) queryParams.append("name", params.name);
		if (params?.location) queryParams.append("location", params.location);
		if (params?.dateFrom) queryParams.append("dateFrom", params.dateFrom);
		if (params?.dateTo) queryParams.append("dateTo", params.dateTo);

		const url = `${BASE_URL}/events${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
		const response = await fetch(url, {
			method: "GET",
			headers: token ? getAuthHeaders(token) : getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: EventWithRelations[] = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching events:", error);
		throw error;
	}
}

/**
 * Get event by ID. Requires Auth
 */
export async function getEventById(id: string, token: string): Promise<EventWithRelations> {
	try {
		const response = await fetch(`${BASE_URL}/events/${id}`, {
			method: "GET",
			headers: getAuthHeaders(token),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: EventWithRelations = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching event:", error);
		throw error;
	}
}

/**
 * Update event. Requires Auth
 */
export async function updateEvent(id: string, data: UpdateEventRequest, token: string): Promise<EventWithRelations> {
	try {
		const response = await fetch(`${BASE_URL}/events/${id}`, {
			method: "PUT",
			headers: getAuthHeaders(token),
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: EventWithRelations = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error updating event:", error);
		throw error;
	}
}

/**
 * Delete event. Requires Auth
 */
export async function deleteEvent(id: string, token: string): Promise<DeleteEventResponse> {
	try {
		const response = await fetch(`${BASE_URL}/events/${id}`, {
			method: "DELETE",
			headers: getAuthHeaders(token),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: DeleteEventResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error deleting event:", error);
		throw error;
	}
}

/**
 * Get events by status. Requires Auth
 */
export async function getEventsByStatus(status: "pending" | "approved" | "rejected", token: string): Promise<Event[]> {
	try {
		const response = await fetch(`${BASE_URL}/events/status/${status}`, {
			method: "GET",
			headers: getAuthHeaders(token),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: Event[] = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching events by status:", error);
		throw error;
	}
}

/**
 * Get approved events for planning. Requires Auth
 */
export async function getEventsForPlanning(token: string): Promise<Event[]> {
	try {
		const response = await fetch(`${BASE_URL}/events/niyojan`, {
			method: "GET",
			headers: getAuthHeaders(token),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: Event[] = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching events for planning:", error);
		throw error;
	}
}

/**
 * Approve an event. Requires Auth, Roles: sub_admin | special_branch | sp
 */
export async function approveEvent(id: string, data: ApproveEventRequest, token: string): Promise<ApproveEventResponse> {
	try {
		const response = await fetch(`${BASE_URL}/events/${id}/approve`, {
			method: "PATCH",
			headers: getAuthHeaders(token),
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: ApproveEventResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error approving event:", error);
		throw error;
	}
}

// ============================================================================
// TYPES - Events (continued)
// ============================================================================

export interface RejectEventRequest {
	reason: string;
	comments?: string;
}

export interface RejectEventResponse {
	msg: string;
	event: Event;
}

export interface UpdatePlanningStatusRequest {
	status: "planning" | "planned" | "in_progress" | "completed";
	comments?: string;
	assignedOfficers?: string[];
}

export interface UpdatePlanningStatusResponse {
	msg: string;
	event: Event;
}

export interface Parishisht {
	_id: string;
	title: string;
	description: string;
	location: string;
	type: string;
	eventId: string;
	createdAt: string;
}

export interface CreateParishishtRequest {
	title: string;
	description: string;
	location: string;
	type: string;
	additionalInfo?: string;
}

export interface CreateParishishtResponse {
	msg: string;
	parishisht: Parishisht;
}

export interface DeploymentOfficersResponse {
	officers: User[];
	coordinationOfficer: User;
}

// ============================================================================
// TYPES - Location
// ============================================================================

export interface UpdateLocationRequest {
	lat: number;
	lng: number;
	eventId?: string;
}

export interface Location {
	_id: string;
	officerId: string;
	lat: number;
	lng: number;
	eventId?: string;
	createdAt: string;
	updatedAt: string;
}

export interface UpdateLocationResponse {
	msg: string;
	location: Location;
}

export interface LiveLocation {
	_id: string;
	officerId: {
		name: string;
		sevarthId: string;
	};
	lat: number;
	lng: number;
	eventId?: string;
	createdAt: string;
	updatedAt: string;
}

// ============================================================================
// TYPES - Duties / Officers Locations
// ============================================================================

export interface OfficerDutyLocation {
	officerId: string;
	sevrathId: string;
	name: string;
	rank: string;
	mobileNumber: string;
	location: {
		latitude: number;
		longitude: number;
		source: string;
		lastUpdated: string;
	};
	eventName: string;
	pointName: string;
	lastAttendanceAt: string;
}

export interface OfficersLocationsSummary {
	withLiveLocation: number;
	withReportedLocation: number;
	withDutyLocation: number;
	withoutLocation: number;
}

export interface OfficersLocationsResponse {
	success: boolean;
	msg: string;
	data: {
		totalOfficers: number;
		totalDuties: number;
		summary: OfficersLocationsSummary;
		officers: OfficerDutyLocation[];
		byEvent: Record<string, OfficerDutyLocation[]>;
	};
}

// ============================================================================
// TYPES - Police Stations
// ============================================================================

export interface PoliceStation {
	_id: string;
	name: string;
	name_in_marathi: string;
	division: string;
}

export interface GetPoliceStationsResponse {
	stations: PoliceStation[];
}

// ============================================================================
// TYPES - Officers
// ============================================================================

export interface Officer {
	_id: string;
	name: string;
	rank: string;
	badgeNumber: string;
	mobile: string;
	psId: string;
}

export interface CreateOfficerRequest {
	name: string;
	rank: string;
	badgeNumber: string;
	mobile: string;
	psId: string;
}

export interface CreateOfficerResponse {
	msg: string;
	officer: Officer;
}

export interface GetOfficersByStationResponse {
	count: number;
	officers: Array<
		Officer & {
			psId: {
				name: string;
			};
		}
	>;
}

export interface MarkVIPAttendanceRequest {
	userLatitude: number;
	userLongitude: number;
}

export interface MarkVIPAttendanceResponse {
	msg: string;
	time: string;
}

// ============================================================================
// TYPES - Officers in Police
// ============================================================================

export interface OfficersInPolice {
	_id: string;
	timestamp: string;
	sevrathId: string;
	bakkalNumber?: string;
	firstName: string;
	middleName?: string;
	lastName: string;
	rank: string;
	dateOfBirth?: string;
	dateOfJoining?: string;
	gender?: "Male" | "Female" | "Other";
	policeStation?: string;
	specialBranch?: string;
	isIncharge: boolean;
	mobileNumber?: string;
	name: string;
	badgeNumber: string;
	createdAt: string;
	updatedAt: string;
}

export interface GetOfficersInPoliceQueryParams {
	page?: number;
	limit?: number;
	rank?: string;
	policeStation?: string;
	specialBranch?: string;
	isIncharge?: boolean;
	search?: string;
}

export interface GetOfficersInPoliceResponse {
	success: boolean;
	data: OfficersInPolice[];
	pagination: {
		page: number;
		pages: number;
		total: number;
		limit: number;
	};
}

export interface OfficersStatsResponse {
	success: boolean;
	data: {
		totalOfficers: number;
		inchargeOfficers: number;
		rankDistribution: Array<{
			_id: string;
			count: number;
		}>;
		stationDistribution: Array<{
			_id: string;
			count: number;
		}>;
		genderDistribution: Array<{
			_id: string;
			count: number;
		}>;
	};
}

export interface GetOfficersInChargeResponse {
	success: boolean;
	data: OfficersInPolice[];
	count: number;
}

export interface GetOfficerByIdResponse {
	success: boolean;
	data: OfficersInPolice;
}

// ============================================================================
// EVENTS FUNCTIONS (continued)
// ============================================================================

/**
 * Reject an event. Requires Auth, Roles: sub_admin | special_branch | sp
 */
export async function rejectEvent(id: string, data: RejectEventRequest, token: string): Promise<RejectEventResponse> {
	try {
		const response = await fetch(`${BASE_URL}/events/${id}/reject`, {
			method: "PATCH",
			headers: getAuthHeaders(token),
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: RejectEventResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error rejecting event:", error);
		throw error;
	}
}

/**
 * Update event planning status. Requires Auth, Roles: sub_admin | special_branch | sp
 */
export async function updateEventPlanningStatus(id: string, data: UpdatePlanningStatusRequest, token: string): Promise<UpdatePlanningStatusResponse> {
	try {
		const response = await fetch(`${BASE_URL}/events/${id}/planning-status`, {
			method: "PATCH",
			headers: getAuthHeaders(token),
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: UpdatePlanningStatusResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error updating planning status:", error);
		throw error;
	}
}

/**
 * Get event annexures. Requires Auth
 */
export async function getEventParishishte(eventId: string, token: string): Promise<Parishisht[]> {
	try {
		const response = await fetch(`${BASE_URL}/events/${eventId}/parishishte`, {
			method: "GET",
			headers: getAuthHeaders(token),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: Parishisht[] = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching event annexures:", error);
		throw error;
	}
}

/**
 * Create event annexure. Requires Auth
 */
export async function createEventParishisht(eventId: string, data: CreateParishishtRequest, token: string): Promise<CreateParishishtResponse> {
	try {
		const response = await fetch(`${BASE_URL}/events/${eventId}/parishishte`, {
			method: "POST",
			headers: getAuthHeaders(token),
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: CreateParishishtResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error creating event annexure:", error);
		throw error;
	}
}

/**
 * Get deployment officers for event. Requires Auth
 */
export async function getEventDeploymentOfficers(eventId: string, token: string): Promise<DeploymentOfficersResponse> {
	try {
		const response = await fetch(`${BASE_URL}/events/${eventId}/deployment-officers`, {
			method: "GET",
			headers: getAuthHeaders(token),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: DeploymentOfficersResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching deployment officers:", error);
		throw error;
	}
}

// ============================================================================
// LOCATION FUNCTIONS
// ============================================================================

/**
 * Update officer location. Requires Auth
 */
export async function updateLocation(data: UpdateLocationRequest, token: string): Promise<UpdateLocationResponse> {
	try {
		const response = await fetch(`${BASE_URL}/location/update`, {
			method: "POST",
			headers: getAuthHeaders(token),
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: UpdateLocationResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error updating location:", error);
		throw error;
	}
}

/**
 * Get live locations for an event
 */
export async function getLiveLocations(eventId: string): Promise<LiveLocation[]> {
	try {
		const response = await fetch(`${BASE_URL}/location/live/${eventId}`, {
			method: "GET",
			headers: getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: LiveLocation[] = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching live locations:", error);
		throw error;
	}
}

/**
 * Get duty officers live locations summary
 */
export async function getDutyOfficersLocations(token?: string): Promise<OfficersLocationsResponse> {
	try {
		const response = await fetch("https://backend.smartbandobast.in/api/duties/officers-locations", {
			method: "GET",
			headers: token ? getAuthHeaders(token) : getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: OfficersLocationsResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching duty officers locations:", error);
		throw error;
	}
}

// ============================================================================
// POLICE STATIONS FUNCTIONS
// ============================================================================

/**
 * Get all police stations
 */
export async function getPoliceStations(): Promise<GetPoliceStationsResponse> {
	try {
		const response = await fetch(`${BASE_URL}/police/get-stations`, {
			method: "GET",
			headers: getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: GetPoliceStationsResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching police stations:", error);
		throw error;
	}
}

// ============================================================================
// OFFICERS FUNCTIONS
// ============================================================================

/**
 * Add a new officer
 */
export async function createOfficer(data: CreateOfficerRequest): Promise<CreateOfficerResponse> {
	try {
		const response = await fetch(`${BASE_URL}/officers`, {
			method: "POST",
			headers: getAuthHeaders(),
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: CreateOfficerResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error creating officer:", error);
		throw error;
	}
}

/**
 * Get officers by police station ID
 */
export async function getOfficersByStation(psId: string): Promise<GetOfficersByStationResponse> {
	try {
		const response = await fetch(`${BASE_URL}/officers/bystation/${psId}`, {
			method: "GET",
			headers: getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: GetOfficersByStationResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching officers by station:", error);
		throw error;
	}
}

/**
 * Mark attendance for VIP visit. Requires Auth
 */
export async function markVIPAttendance(eventId: string, assignmentId: string, data: MarkVIPAttendanceRequest, token: string): Promise<MarkVIPAttendanceResponse> {
	try {
		const response = await fetch(`${BASE_URL}/officers/vip/${eventId}/attendance/${assignmentId}`, {
			method: "POST",
			headers: getAuthHeaders(token),
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: MarkVIPAttendanceResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error marking VIP attendance:", error);
		throw error;
	}
}

// ============================================================================
// OFFICERS IN POLICE FUNCTIONS
// ============================================================================

/**
 * Get all officers with pagination and filtering
 */
export async function getOfficersInPolice(params?: GetOfficersInPoliceQueryParams): Promise<GetOfficersInPoliceResponse> {
	try {
		const queryParams = new URLSearchParams();
		if (params?.page) queryParams.append("page", params.page.toString());
		if (params?.limit) queryParams.append("limit", params.limit.toString());
		if (params?.rank) queryParams.append("rank", params.rank);
		if (params?.policeStation) queryParams.append("policeStation", params.policeStation);
		if (params?.specialBranch) queryParams.append("specialBranch", params.specialBranch);
		if (params?.isIncharge !== undefined) queryParams.append("isIncharge", params.isIncharge.toString());
		if (params?.search) queryParams.append("search", params.search);

		const url = `${BASE_URL}/officers-in-police${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
		const response = await fetch(url, {
			method: "GET",
			headers: getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: GetOfficersInPoliceResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching officers in police:", error);
		throw error;
	}
}

/**
 * Get officers statistics
 */
export async function getOfficersStats(): Promise<OfficersStatsResponse> {
	try {
		const response = await fetch(`${BASE_URL}/officers-in-police/stats`, {
			method: "GET",
			headers: getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: OfficersStatsResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching officers stats:", error);
		throw error;
	}
}

/**
 * Get all incharge officers
 */
export async function getInchargeOfficers(): Promise<GetOfficersInChargeResponse> {
	try {
		const response = await fetch(`${BASE_URL}/officers-in-police/incharge`, {
			method: "GET",
			headers: getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: GetOfficersInChargeResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching incharge officers:", error);
		throw error;
	}
}

/**
 * Get officer by ID
 */
export async function getOfficerById(id: string): Promise<GetOfficerByIdResponse> {
	try {
		const response = await fetch(`${BASE_URL}/officers-in-police/${id}`, {
			method: "GET",
			headers: getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: GetOfficerByIdResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching officer by ID:", error);
		throw error;
	}
}

/**
 * Get officer by sevrathId
 */
export async function getOfficerBySevrathId(sevrathId: string): Promise<GetOfficerByIdResponse> {
	try {
		const response = await fetch(`${BASE_URL}/officers-in-police/sevrath/${sevrathId}`, {
			method: "GET",
			headers: getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: GetOfficerByIdResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching officer by sevrathId:", error);
		throw error;
	}
}

/**
 * Get officers by rank
 */
export async function getOfficersByRank(rank: string): Promise<GetOfficersInChargeResponse> {
	try {
		const response = await fetch(`${BASE_URL}/officers-in-police/rank/${rank}`, {
			method: "GET",
			headers: getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: GetOfficersInChargeResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching officers by rank:", error);
		throw error;
	}
}

/**
 * Get officers by police station
 */
export async function getOfficersByPoliceStation(station: string): Promise<GetOfficersInChargeResponse> {
	try {
		const response = await fetch(`${BASE_URL}/officers-in-police/station/${station}`, {
			method: "GET",
			headers: getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: GetOfficersInChargeResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching officers by station:", error);
		throw error;
	}
}

// ============================================================================
// TYPES - Officers in Police (continued)
// ============================================================================

export interface CreateOfficerInPoliceRequest {
	timestamp: string;
	sevrathId: string;
	bakkalNumber?: string;
	firstName: string;
	middleName?: string;
	lastName: string;
	rank: string;
	dateOfBirth?: string;
	dateOfJoining?: string;
	gender?: "Male" | "Female" | "Other";
	policeStation?: string;
	specialBranch?: string;
	isIncharge?: boolean;
	mobileNumber?: string;
}

export interface CreateOfficerInPoliceResponse {
	success: boolean;
	data: OfficersInPolice;
	msg: string;
}

export interface UpdateOfficerInPoliceResponse {
	success: boolean;
	data: OfficersInPolice;
	msg: string;
}

export interface DeleteOfficerInPoliceResponse {
	success: boolean;
	msg: string;
}

/**
 * Create new officer
 */
export async function createOfficerInPolice(data: CreateOfficerInPoliceRequest): Promise<CreateOfficerInPoliceResponse> {
	try {
		const response = await fetch(`${BASE_URL}/officers-in-police`, {
			method: "POST",
			headers: getAuthHeaders(),
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: CreateOfficerInPoliceResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error creating officer in police:", error);
		throw error;
	}
}

/**
 * Update officer
 */
export async function updateOfficerInPolice(id: string, data: Partial<CreateOfficerInPoliceRequest>): Promise<UpdateOfficerInPoliceResponse> {
	try {
		const response = await fetch(`${BASE_URL}/officers-in-police/${id}`, {
			method: "PUT",
			headers: getAuthHeaders(),
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: UpdateOfficerInPoliceResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error updating officer:", error);
		throw error;
	}
}

/**
 * Delete officer
 */
export async function deleteOfficerInPolice(id: string): Promise<DeleteOfficerInPoliceResponse> {
	try {
		const response = await fetch(`${BASE_URL}/officers-in-police/${id}`, {
			method: "DELETE",
			headers: getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: DeleteOfficerInPoliceResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error deleting officer:", error);
		throw error;
	}
}

// ============================================================================
// TYPES - Lists
// ============================================================================

export interface GetPoliceStationsListResponse {
	success: boolean;
	data: string[];
	count: number;
}

export interface GetSpecialUnitsListResponse {
	success: boolean;
	data: string[];
	count: number;
}

export interface GetRanksListResponse {
	success: boolean;
	data: string[];
	count: number;
}

export interface GetAllListsResponse {
	success: boolean;
	data: {
		policeStations: string[];
		specialUnits: string[];
		ranks: string[];
	};
	counts: {
		policeStations: number;
		specialUnits: number;
		ranks: number;
	};
}

// ============================================================================
// LISTS FUNCTIONS
// ============================================================================

/**
 * Get all unique police stations
 */
export async function getPoliceStationsList(): Promise<GetPoliceStationsListResponse> {
	try {
		const response = await fetch(`${BASE_URL}/lists/police-stations`, {
			method: "GET",
			headers: getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: GetPoliceStationsListResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching police stations list:", error);
		throw error;
	}
}

/**
 * Get all unique special units
 */
export async function getSpecialUnitsList(): Promise<GetSpecialUnitsListResponse> {
	try {
		const response = await fetch(`${BASE_URL}/lists/special-units`, {
			method: "GET",
			headers: getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: GetSpecialUnitsListResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching special units list:", error);
		throw error;
	}
}

/**
 * Get all unique ranks
 */
export async function getRanksList(): Promise<GetRanksListResponse> {
	try {
		const response = await fetch(`${BASE_URL}/lists/ranks`, {
			method: "GET",
			headers: getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: GetRanksListResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching ranks list:", error);
		throw error;
	}
}

/**
 * Get all lists in one request
 */
export async function getAllLists(): Promise<GetAllListsResponse> {
	try {
		const response = await fetch(`${BASE_URL}/lists/all`, {
			method: "GET",
			headers: getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: GetAllListsResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching all lists:", error);
		throw error;
	}
}

// ============================================================================
// TYPES - Transfer Requests
// ============================================================================

export interface TransferRequest {
	_id: string;
	officerId: string;
	currentStationId: string;
	requestedStationId: string;
	reason: string;
	requestedBy: string;
	requestDate: string;
	status: "pending" | "approved" | "rejected" | "cancelled";
	reviewedBy?: string;
	reviewDate?: string;
	reviewComments?: string;
	createdAt: string;
	updatedAt: string;
}

export interface GetTransferRequestsQueryParams {
	status?: "pending" | "approved" | "rejected" | "cancelled";
	officerId?: string;
	page?: number;
	limit?: number;
}

export interface GetTransferRequestsResponse {
	success: boolean;
	data: Array<
		TransferRequest & {
			officerId: {
				firstName: string;
				lastName: string;
				sevrathId: string;
				rank: string;
				policeStation: string;
			};
			requestedBy: {
				name: string;
				email: string;
			};
			reviewedBy?: {
				name: string;
				email: string;
			};
		}
	>;
	pagination: {
		page: number;
		pages: number;
		total: number;
		limit: number;
	};
}

export interface GetTransferRequestByIdResponse {
	success: boolean;
	data: TransferRequest & {
		officerId: Officer;
		requestedBy: User;
		reviewedBy?: User;
	};
}

export interface CreateTransferRequestRequest {
	officerId: string;
	currentStationId: string;
	requestedStationId: string;
	reason: string;
}

export interface CreateTransferRequestResponse {
	success: boolean;
	message: string;
	requestId: string;
}

export interface UpdateTransferRequestStatusRequest {
	status: "approved" | "rejected" | "cancelled";
	reviewComments?: string;
}

export interface UpdateTransferRequestStatusResponse {
	success: boolean;
	message: string;
	data: TransferRequest;
}

export interface GetTransferRequestStationsResponse {
	success: boolean;
	data: string[];
	count: number;
}

export interface TransferRequestStatsResponse {
	success: boolean;
	data: {
		total: number;
		pending: number;
		approved: number;
		rejected: number;
		statusDistribution: unknown;
	};
}

// ============================================================================
// TRANSFER REQUESTS FUNCTIONS
// ============================================================================

/**
 * Get available police stations for transfer
 */
export async function getTransferRequestStations(): Promise<GetTransferRequestStationsResponse> {
	try {
		const response = await fetch(`${BASE_URL}/transfer-requests/stations`, {
			method: "GET",
			headers: getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: GetTransferRequestStationsResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching transfer request stations:", error);
		throw error;
	}
}

/**
 * Get all transfer requests with filtering. Requires Auth
 */
export async function getTransferRequests(params?: GetTransferRequestsQueryParams, token?: string): Promise<GetTransferRequestsResponse> {
	try {
		const queryParams = new URLSearchParams();
		if (params?.status) queryParams.append("status", params.status);
		if (params?.officerId) queryParams.append("officerId", params.officerId);
		if (params?.page) queryParams.append("page", params.page.toString());
		if (params?.limit) queryParams.append("limit", params.limit.toString());

		const url = `${BASE_URL}/transfer-requests${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
		const response = await fetch(url, {
			method: "GET",
			headers: token ? getAuthHeaders(token) : getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: GetTransferRequestsResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching transfer requests:", error);
		throw error;
	}
}

/**
 * Get transfer request by ID. Requires Auth
 */
export async function getTransferRequestById(id: string, token: string): Promise<GetTransferRequestByIdResponse> {
	try {
		const response = await fetch(`${BASE_URL}/transfer-requests/${id}`, {
			method: "GET",
			headers: getAuthHeaders(token),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: GetTransferRequestByIdResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching transfer request:", error);
		throw error;
	}
}

/**
 * Create transfer request. Requires Auth
 */
export async function createTransferRequest(data: CreateTransferRequestRequest, token: string): Promise<CreateTransferRequestResponse> {
	try {
		const response = await fetch(`${BASE_URL}/transfer-requests`, {
			method: "POST",
			headers: getAuthHeaders(token),
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: CreateTransferRequestResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error creating transfer request:", error);
		throw error;
	}
}

/**
 * Update transfer request status. Requires Auth
 */
export async function updateTransferRequestStatus(id: string, data: UpdateTransferRequestStatusRequest, token: string): Promise<UpdateTransferRequestStatusResponse> {
	try {
		const response = await fetch(`${BASE_URL}/transfer-requests/${id}/status`, {
			method: "PUT",
			headers: getAuthHeaders(token),
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: UpdateTransferRequestStatusResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error updating transfer request status:", error);
		throw error;
	}
}

/**
 * Get transfer request statistics. Requires Auth
 */
export async function getTransferRequestStats(token: string): Promise<TransferRequestStatsResponse> {
	try {
		const response = await fetch(`${BASE_URL}/transfer-requests/stats/overview`, {
			method: "GET",
			headers: getAuthHeaders(token),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: TransferRequestStatsResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching transfer request stats:", error);
		throw error;
	}
}

// ============================================================================
// TYPES - Upload
// ============================================================================

export interface UploadProfilePictureRequest {
	imageData: string;
}

export interface UploadProfilePictureResponse {
	success: boolean;
	msg: string;
	msgEn: string;
	profilePicUrl: string;
	user: UserProfile;
}

export interface GetProfileResponse {
	success: boolean;
	user: UserProfile & {
		psId?: PoliceStation;
	};
}

export interface DeleteProfilePictureResponse {
	success: boolean;
	msg: string;
	msgEn: string;
	user: UserProfile;
}

// ============================================================================
// UPLOAD FUNCTIONS
// ============================================================================

/**
 * Upload profile picture. Requires Auth
 */
export async function uploadProfilePicture(data: UploadProfilePictureRequest, token: string): Promise<UploadProfilePictureResponse> {
	try {
		const response = await fetch(`${BASE_URL}/upload/profile-picture`, {
			method: "POST",
			headers: getAuthHeaders(token),
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: UploadProfilePictureResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error uploading profile picture:", error);
		throw error;
	}
}

/**
 * Get user profile with picture. Requires Auth
 */
export async function getProfile(token: string): Promise<GetProfileResponse> {
	try {
		const response = await fetch(`${BASE_URL}/upload/profile`, {
			method: "GET",
			headers: getAuthHeaders(token),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: GetProfileResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching profile:", error);
		throw error;
	}
}

/**
 * Delete profile picture. Requires Auth
 */
export async function deleteProfilePicture(token: string): Promise<DeleteProfilePictureResponse> {
	try {
		const response = await fetch(`${BASE_URL}/upload/profile-picture`, {
			method: "DELETE",
			headers: getAuthHeaders(token),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: DeleteProfilePictureResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error deleting profile picture:", error);
		throw error;
	}
}

// ============================================================================
// TYPES - Point Allocations
// ============================================================================

export interface PointAllocation {
	_id: string;
	timestamp: string;
	policeStation: string;
	festivalEventName: string;
	sectionAppendix?: string;
	pointName: string;
	latitude: number;
	longitude: number;
	eventType: string;
	priority: string;
	status: string;
	estimatedCrowd?: number;
	securityLevel: string;
	assignedOfficers: string[];
	notes?: string;
	startDate?: string;
	endDate?: string;
	createdBy: string;
	updatedBy?: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreatePointAllocationRequest {
	timestamp?: string;
	policeStation: string;
	festivalEventName: string;
	sectionAppendix?: string;
	pointName: string;
	latitude: number;
	longitude: number;
	eventType?: string;
	priority?: string;
	status?: string;
	estimatedCrowd?: number;
	securityLevel?: string;
	assignedOfficers?: string[];
	notes?: string;
	startDate?: string;
	endDate?: string;
}

export interface CreatePointAllocationResponse {
	msg: string;
	pointAllocation: PointAllocation & {
		assignedOfficers: Officer[];
	};
}

export interface GetPointAllocationsQueryParams {
	policeStation?: string;
	festivalEventName?: string;
	pointName?: string;
	eventType?: string;
	status?: string;
	priority?: string;
	dateFrom?: string;
	dateTo?: string;
	page?: number;
	limit?: number;
}

export interface GetPointAllocationsResponse {
	pointAllocations: Array<
		PointAllocation & {
			assignedOfficers: Officer[];
			createdBy: User;
		}
	>;
	pagination: {
		currentPage: number;
		totalPages: number;
		totalItems: number;
		itemsPerPage: number;
	};
}

export interface GetPointAllocationByIdResponse {
	_id: string;
	timestamp: string;
	policeStation: string;
	festivalEventName: string;
	sectionAppendix?: string;
	pointName: string;
	latitude: number;
	longitude: number;
	eventType: string;
	priority: string;
	status: string;
	estimatedCrowd?: number;
	securityLevel: string;
	assignedOfficers: Officer[];
	notes?: string;
	startDate?: string;
	endDate?: string;
	createdBy: User;
	updatedBy?: User;
	createdAt: string;
	updatedAt: string;
}

export interface DeletePointAllocationResponse {
	msg: string;
}

export interface BulkUploadPointAllocationsRequest {
	pointAllocations: CreatePointAllocationRequest[];
}

export interface BulkUploadPointAllocationsResponse {
	msg: string;
	results: {
		total: number;
		success: number;
		failed: number;
		errors: Array<{
			index: number;
			error: string;
			data: unknown;
		}>;
	};
}

export interface GetPointAllocationsByLocationQueryParams {
	lat: number;
	lng: number;
	radius?: number;
}

// ============================================================================
// POINT ALLOCATIONS FUNCTIONS
// ============================================================================

/**
 * Create point allocation. Requires Auth
 */
export async function createPointAllocation(data: CreatePointAllocationRequest, token: string): Promise<CreatePointAllocationResponse> {
	try {
		const response = await fetch(`${BASE_URL}/point-allocations`, {
			method: "POST",
			headers: getAuthHeaders(token),
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: CreatePointAllocationResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error creating point allocation:", error);
		throw error;
	}
}

/**
 * Get all point allocations with filtering. Requires Auth
 */
export async function getPointAllocations(params?: GetPointAllocationsQueryParams, token?: string): Promise<GetPointAllocationsResponse> {
	try {
		const queryParams = new URLSearchParams();
		if (params?.policeStation) queryParams.append("policeStation", params.policeStation);
		if (params?.festivalEventName) queryParams.append("festivalEventName", params.festivalEventName);
		if (params?.pointName) queryParams.append("pointName", params.pointName);
		if (params?.eventType) queryParams.append("eventType", params.eventType);
		if (params?.status) queryParams.append("status", params.status);
		if (params?.priority) queryParams.append("priority", params.priority);
		if (params?.dateFrom) queryParams.append("dateFrom", params.dateFrom);
		if (params?.dateTo) queryParams.append("dateTo", params.dateTo);
		if (params?.page) queryParams.append("page", params.page.toString());
		if (params?.limit) queryParams.append("limit", params.limit.toString());

		const url = `${BASE_URL}/point-allocations${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
		const response = await fetch(url, {
			method: "GET",
			headers: token ? getAuthHeaders(token) : getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: GetPointAllocationsResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching point allocations:", error);
		throw error;
	}
}

/**
 * Get upcoming events. Requires Auth
 */
export async function getUpcomingPointAllocations(token: string): Promise<PointAllocation[]> {
	try {
		const response = await fetch(`${BASE_URL}/point-allocations/upcoming`, {
			method: "GET",
			headers: getAuthHeaders(token),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: PointAllocation[] = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching upcoming point allocations:", error);
		throw error;
	}
}

/**
 * Get point allocations by location (within radius). Requires Auth
 */
export async function getPointAllocationsByLocation(params: GetPointAllocationsByLocationQueryParams, token: string): Promise<PointAllocation[]> {
	try {
		const queryParams = new URLSearchParams();
		queryParams.append("lat", params.lat.toString());
		queryParams.append("lng", params.lng.toString());
		if (params.radius) queryParams.append("radius", params.radius.toString());

		const url = `${BASE_URL}/point-allocations/location?${queryParams.toString()}`;
		const response = await fetch(url, {
			method: "GET",
			headers: getAuthHeaders(token),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: PointAllocation[] = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching point allocations by location:", error);
		throw error;
	}
}

/**
 * Get point allocations by police station. Requires Auth
 */
export async function getPointAllocationsByPoliceStation(station: string, status?: string, token?: string): Promise<PointAllocation[]> {
	try {
		const queryParams = new URLSearchParams();
		if (status) queryParams.append("status", status);

		const url = `${BASE_URL}/point-allocations/police-station/${station}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
		const response = await fetch(url, {
			method: "GET",
			headers: token ? getAuthHeaders(token) : getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: PointAllocation[] = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching point allocations by station:", error);
		throw error;
	}
}

/**
 * Get point allocation by ID. Requires Auth
 */
export async function getPointAllocationById(id: string, token: string): Promise<GetPointAllocationByIdResponse> {
	try {
		const response = await fetch(`${BASE_URL}/point-allocations/${id}`, {
			method: "GET",
			headers: getAuthHeaders(token),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: GetPointAllocationByIdResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching point allocation:", error);
		throw error;
	}
}

/**
 * Update point allocation. Requires Auth
 */
export async function updatePointAllocation(id: string, data: Partial<CreatePointAllocationRequest>, token: string): Promise<PointAllocation> {
	try {
		const response = await fetch(`${BASE_URL}/point-allocations/${id}`, {
			method: "PUT",
			headers: getAuthHeaders(token),
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: PointAllocation = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error updating point allocation:", error);
		throw error;
	}
}

/**
 * Delete point allocation. Requires Auth
 */
export async function deletePointAllocation(id: string, token: string): Promise<DeletePointAllocationResponse> {
	try {
		const response = await fetch(`${BASE_URL}/point-allocations/${id}`, {
			method: "DELETE",
			headers: getAuthHeaders(token),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: DeletePointAllocationResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error deleting point allocation:", error);
		throw error;
	}
}

/**
 * Bulk upload point allocations. Requires Auth
 */
export async function bulkUploadPointAllocations(data: BulkUploadPointAllocationsRequest, token: string): Promise<BulkUploadPointAllocationsResponse> {
	try {
		const response = await fetch(`${BASE_URL}/point-allocations/bulk-upload`, {
			method: "POST",
			headers: getAuthHeaders(token),
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: BulkUploadPointAllocationsResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error bulk uploading point allocations:", error);
		throw error;
	}
}

// ============================================================================
// TYPES - Officer Allocation
// ============================================================================

export interface SubmitOfficerAllocationRequest {
	eventDetails: {
		eventName?: string;
		description?: string;
		eventDate?: string;
		endDate?: string;
		location?: string;
		sensitivity?: string;
	};
	officerData: Record<
		string,
		{
			male: number;
			female: number;
			total: number;
		}
	>;
	totalManpower?: number;
	createdBy?: string;
}

export interface SubmitOfficerAllocationResponse {
	success: boolean;
	msg: string;
	event: {
		id: string;
		name: string;
		date: string;
		location: string;
		officerRequirements: unknown;
		totalManpowerRequired: number;
		status: string;
		createdBy: User;
		createdAt: string;
	};
}

export interface GetOfficerAllocationRequestsQueryParams {
	status?: string;
	limit?: number;
	page?: number;
}

export interface GetOfficerAllocationRequestsResponse {
	success: boolean;
	events: Array<
		Event & {
			createdBy: User;
			approvedBy?: User;
		}
	>;
	pagination: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	};
}

export interface GetAvailableOfficersQueryParams {
	rank?: string;
	gender?: string;
	stationId?: string;
}

export interface GetAvailableOfficersResponse {
	success: boolean;
	officers: Officer[];
	total: number;
	filters: {
		rank: string;
		gender: string;
		stationId: string;
		stationName: string;
	};
}

export interface Assignment {
	_id: string;
	officerId: string;
	rank: string;
	gender: "male" | "female";
	location?: string;
	assignedBy: string;
	assignedAt: string;
	status: "assigned" | "confirmed" | "absent";
}

export interface AssignOfficersRequest {
	assignedOfficers: Array<{
		officerId: string;
		rank: string;
		gender: "male" | "female";
		location?: string;
	}>;
}

export interface AssignOfficersResponse {
	success: boolean;
	msg: string;
	event: {
		id: string;
		name: string;
		assignedOfficers: Assignment[];
		planningStatus: string;
	};
}

export interface GetEventOfficerAllocationResponse {
	success: boolean;
	event: {
		id: string;
		name: string;
		description: string;
		date: string;
		endDate?: string;
		location: string;
		sensitivity: string;
		status: string;
		planningStatus: string;
		officerRequirements: unknown;
		totalManpowerRequired: number;
		assignedOfficers: Assignment[];
		createdBy: User;
		approvedBy?: User;
		createdAt: string;
		updatedAt: string;
	};
}

// ============================================================================
// OFFICER ALLOCATION FUNCTIONS
// ============================================================================

/**
 * Submit officer allocation request. Requires Auth, Roles: user | sub_admin | sdpo | special_branch | sp
 */
export async function submitOfficerAllocation(data: SubmitOfficerAllocationRequest, token: string): Promise<SubmitOfficerAllocationResponse> {
	try {
		const response = await fetch(`${BASE_URL}/officer-allocation/submit`, {
			method: "POST",
			headers: getAuthHeaders(token),
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: SubmitOfficerAllocationResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error submitting officer allocation:", error);
		throw error;
	}
}

/**
 * Get officer allocation requests by user. Requires Auth, Roles: user | sub_admin | sdpo | special_branch | sp
 */
export async function getOfficerAllocationRequests(params?: GetOfficerAllocationRequestsQueryParams, token?: string): Promise<GetOfficerAllocationRequestsResponse> {
	try {
		const queryParams = new URLSearchParams();
		if (params?.status) queryParams.append("status", params.status);
		if (params?.limit) queryParams.append("limit", params.limit.toString());
		if (params?.page) queryParams.append("page", params.page.toString());

		const url = `${BASE_URL}/officer-allocation/requests${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
		const response = await fetch(url, {
			method: "GET",
			headers: token ? getAuthHeaders(token) : getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: GetOfficerAllocationRequestsResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching officer allocation requests:", error);
		throw error;
	}
}

/**
 * Get available officers by rank and gender. Requires Auth, Roles: user | sub_admin | sdpo | special_branch | sp
 */
export async function getAvailableOfficers(params?: GetAvailableOfficersQueryParams, token?: string): Promise<GetAvailableOfficersResponse> {
	try {
		const queryParams = new URLSearchParams();
		if (params?.rank) queryParams.append("rank", params.rank);
		if (params?.gender) queryParams.append("gender", params.gender);
		if (params?.stationId) queryParams.append("stationId", params.stationId);

		const url = `${BASE_URL}/officer-allocation/available-officers${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
		const response = await fetch(url, {
			method: "GET",
			headers: token ? getAuthHeaders(token) : getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: GetAvailableOfficersResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching available officers:", error);
		throw error;
	}
}

/**
 * Assign specific officers to event. Requires Auth, Roles: sub_admin | sdpo | special_branch | sp
 */
export async function assignOfficersToEvent(eventId: string, data: AssignOfficersRequest, token: string): Promise<AssignOfficersResponse> {
	try {
		const response = await fetch(`${BASE_URL}/officer-allocation/assign/${eventId}`, {
			method: "POST",
			headers: getAuthHeaders(token),
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: AssignOfficersResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error assigning officers:", error);
		throw error;
	}
}

/**
 * Get event officer allocation details. Requires Auth, Roles: user | sub_admin | sdpo | special_branch | sp
 */
export async function getEventOfficerAllocation(eventId: string, token: string): Promise<GetEventOfficerAllocationResponse> {
	try {
		const response = await fetch(`${BASE_URL}/officer-allocation/event/${eventId}`, {
			method: "GET",
			headers: getAuthHeaders(token),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: GetEventOfficerAllocationResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching event officer allocation:", error);
		throw error;
	}
}

// ============================================================================
// TYPES - VIP Visits
// ============================================================================

export interface VIPVisit {
	_id: string;
	eventType: string;
	title: string;
	date: string;
	startTime?: string;
	endTime?: string;
	location: string;
	purpose?: string;
	createdBy: string;
	policeStation: string;
	sdpo_id?: string;
	officerSummary?: Array<{
		rank: string;
		count: number;
	}>;
	assignedOfficers: Array<{
		userId: string;
		stationId: string;
		rank: string;
		location?: string;
		latitude?: number;
		longitude?: number;
		assignedAt: string;
		attendanceMarkedAt?: string;
	}>;
	status: "pending" | "approved" | "rejected";
	approvedBy?: string;
	sdpoComment?: string;
	dsbStatus: "pending" | "approved" | "rejected";
	dsbApprovedBy?: string;
	dsbRemarks?: string;
	spStatus: "pending" | "approved" | "rejected";
	spComment?: string;
	spApprovedBy?: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreateVIPVisitRequest {
	eventType?: string;
	title: string;
	date: string;
	startTime?: string;
	endTime?: string;
	location: string;
	purpose?: string;
	officerSummary?: Array<{
		rank: string;
		count: number;
	}>;
}

export interface CreateVIPVisitResponse {
	msg: string;
	visit: VIPVisit;
}

export interface GetVIPVisitsQueryParams {
	date?: string;
	title?: string;
	createdBy?: string;
	reviewStatus?: string;
	page?: number;
	limit?: number;
}

export interface GetVIPVisitsResponse {
	total: number;
	page: number;
	limit: number;
	pages: number;
	visits: Array<
		VIPVisit & {
			reviewStatus: string;
		}
	>;
}

export interface GetVIPVisitByIdResponse {
	_id: string;
	eventType: string;
	title: string;
	date: string;
	startTime?: string;
	endTime?: string;
	location: string;
	purpose?: string;
	createdBy: User;
	policeStation: PoliceStation;
	sdpo_id?: string;
	officerSummary?: Array<{
		rank: string;
		count: number;
	}>;
	assignedOfficers: Array<{
		userId: User;
		stationId: PoliceStation;
	}>;
	status: "pending" | "approved" | "rejected";
	approvedBy?: User;
	sdpoComment?: string;
	dsbStatus: "pending" | "approved" | "rejected";
	dsbApprovedBy?: User;
	dsbRemarks?: string;
	spStatus: "pending" | "approved" | "rejected";
	spComment?: string;
	spApprovedBy?: string;
	createdAt: string;
	updatedAt: string;
}

export interface AssignOfficersToVIPVisitRequest {
	officers: Array<{
		userId: string;
		stationId: string;
		rank: string;
	}>;
}

export interface AssignOfficersToVIPVisitResponse {
	msg: string;
	assignedOfficers: Assignment[];
}

export interface GetAssignedOfficersQueryParams {
	stationId?: string;
	rank?: string;
	userId?: string;
}

export interface GetAssignedOfficersResponse {
	eventId: string;
	assignedCount: number;
	officers: Assignment[];
}

export interface UpdateOfficerLocationRequest {
	location?: string;
	latitude?: number;
	longitude?: number;
}

export interface UpdateOfficerLocationResponse {
	msg: string;
	assignment: Assignment;
}

export interface GetAssignedVIPVisitsResponse {
	visits: Array<{
		_id: string;
		title: string;
		date: string;
		location: string;
		purpose: string;
		policeStation: PoliceStation;
		assignment: Assignment;
	}>;
}

export interface GetAssignedVIPVisitResponse {
	_id: string;
	title: string;
	date: string;
	location: string;
	policeStation: PoliceStation;
	assignment: Assignment;
}

export interface DeploymentReview {
	_id: string;
	eventId: string;
	reviewedBy: string;
	comment?: string;
	status: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreateDeploymentReviewRequest {
	comment?: string;
	status: string;
}

export interface CreateDeploymentReviewResponse {
	msg: string;
	review: DeploymentReview;
}

export interface GetDeploymentReviewResponse {
	_id: string;
	eventId: string;
	reviewedBy: User;
	comment?: string;
	status: string;
	createdAt: string;
	updatedAt: string;
}

export interface SPDecisionRequest {
	status: "approved" | "rejected";
	comment?: string;
}

export interface SPDecisionResponse {
	msg: string;
	visit: VIPVisit;
}

export interface SDPODecisionRequest {
	status: "approved" | "rejected";
	comment?: string;
}

export interface SDPODecisionResponse {
	msg: string;
	visit: VIPVisit;
}

export interface OfficerAllocation {
	_id: string;
	eventId: string;
	stationId: string;
	rank: string;
	count: number;
	allocatedBy: string;
	remarks?: string;
	createdAt: string;
	updatedAt: string;
}

export interface AllocateOfficersRequest {
	allocations: Array<{
		stationId: string;
		rank: string;
		count: number;
	}>;
	remarks?: string;
}

export interface AllocateOfficersResponse {
	msg: string;
	allocations: OfficerAllocation[];
}

export interface GetOfficerAllocationsQueryParams {
	allocationId?: string;
	eventId?: string;
	stationId?: string;
	rank?: string;
	allocatedBy?: string;
}

export interface GetOfficerAllocationsResponse {
	msg: string;
	allocation?: OfficerAllocation;
	count?: number;
	allocations?: OfficerAllocation[];
}

// ============================================================================
// VIP VISITS FUNCTIONS
// ============================================================================

/**
 * Create VIP visit. Requires Auth
 */
export async function createVIPVisit(data: CreateVIPVisitRequest, token: string): Promise<CreateVIPVisitResponse> {
	try {
		const response = await fetch(`${BASE_URL}/vip-visits`, {
			method: "POST",
			headers: getAuthHeaders(token),
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: CreateVIPVisitResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error creating VIP visit:", error);
		throw error;
	}
}

/**
 * Get all VIP visits with filtering. Requires Auth
 */
export async function getVIPVisits(params?: GetVIPVisitsQueryParams, token?: string): Promise<GetVIPVisitsResponse> {
	try {
		const queryParams = new URLSearchParams();
		if (params?.date) queryParams.append("date", params.date);
		if (params?.title) queryParams.append("title", params.title);
		if (params?.createdBy) queryParams.append("createdBy", params.createdBy);
		if (params?.reviewStatus) queryParams.append("reviewStatus", params.reviewStatus);
		if (params?.page) queryParams.append("page", params.page.toString());
		if (params?.limit) queryParams.append("limit", params.limit.toString());

		const url = `${BASE_URL}/vip-visits${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
		const response = await fetch(url, {
			method: "GET",
			headers: token ? getAuthHeaders(token) : getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: GetVIPVisitsResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching VIP visits:", error);
		throw error;
	}
}

/**
 * Get VIP visit by ID. Requires Auth
 */
export async function getVIPVisitById(id: string, token: string): Promise<GetVIPVisitByIdResponse> {
	try {
		const response = await fetch(`${BASE_URL}/vip-visits/${id}`, {
			method: "GET",
			headers: getAuthHeaders(token),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: GetVIPVisitByIdResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching VIP visit:", error);
		throw error;
	}
}

/**
 * Assign officers to VIP visit. Requires Auth
 */
export async function assignOfficersToVIPVisit(id: string, data: AssignOfficersToVIPVisitRequest, token: string): Promise<AssignOfficersToVIPVisitResponse> {
	try {
		const response = await fetch(`${BASE_URL}/vip-visits/${id}/assign-officers`, {
			method: "POST",
			headers: getAuthHeaders(token),
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: AssignOfficersToVIPVisitResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error assigning officers to VIP visit:", error);
		throw error;
	}
}

/**
 * Get assigned officers for VIP visit. Requires Auth
 */
export async function getAssignedOfficersForVIPVisit(id: string, params?: GetAssignedOfficersQueryParams, token?: string): Promise<GetAssignedOfficersResponse> {
	try {
		const queryParams = new URLSearchParams();
		if (params?.stationId) queryParams.append("stationId", params.stationId);
		if (params?.rank) queryParams.append("rank", params.rank);
		if (params?.userId) queryParams.append("userId", params.userId);

		const url = `${BASE_URL}/vip-visits/${id}/assigned-officers${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
		const response = await fetch(url, {
			method: "GET",
			headers: token ? getAuthHeaders(token) : getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: GetAssignedOfficersResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching assigned officers:", error);
		throw error;
	}
}

/**
 * Get assigned officer by ID. Requires Auth
 */
export async function getAssignedOfficerById(visitId: string, assignmentId: string, token: string): Promise<Assignment> {
	try {
		const response = await fetch(`${BASE_URL}/vip-visits/${visitId}/assigned-officers/${assignmentId}`, {
			method: "GET",
			headers: getAuthHeaders(token),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: Assignment = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching assigned officer:", error);
		throw error;
	}
}

/**
 * Update officer location for VIP visit. Requires Auth
 */
export async function updateOfficerLocationForVIPVisit(eventId: string, officerId: string, data: UpdateOfficerLocationRequest, token: string): Promise<UpdateOfficerLocationResponse> {
	try {
		const response = await fetch(`${BASE_URL}/vip-visits/${eventId}/assigned-officers/${officerId}/location`, {
			method: "PATCH",
			headers: getAuthHeaders(token),
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: UpdateOfficerLocationResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error updating officer location:", error);
		throw error;
	}
}

/**
 * Get assigned VIP visits for current police officer. Requires Auth, Role: police
 */
export async function getAssignedVIPVisits(token: string): Promise<GetAssignedVIPVisitsResponse> {
	try {
		const response = await fetch(`${BASE_URL}/vip-visits/information/assigned`, {
			method: "GET",
			headers: getAuthHeaders(token),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: GetAssignedVIPVisitsResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching assigned VIP visits:", error);
		throw error;
	}
}

/**
 * Get VIP visit assignment by ID for current user. Requires Auth
 */
export async function getAssignedVIPVisit(id: string, token: string): Promise<GetAssignedVIPVisitResponse> {
	try {
		const response = await fetch(`${BASE_URL}/vip-visits/assigned/${id}`, {
			method: "GET",
			headers: getAuthHeaders(token),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: GetAssignedVIPVisitResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching assigned VIP visit:", error);
		throw error;
	}
}

/**
 * Review deployment request. Requires Auth, Role: sp
 */
export async function createDeploymentReview(eventId: string, data: CreateDeploymentReviewRequest, token: string): Promise<CreateDeploymentReviewResponse> {
	try {
		const response = await fetch(`${BASE_URL}/deployment-review/${eventId}`, {
			method: "POST",
			headers: getAuthHeaders(token),
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: CreateDeploymentReviewResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error creating deployment review:", error);
		throw error;
	}
}

/**
 * Get review for VIP visit. Requires Auth
 */
export async function getDeploymentReview(eventId: string, token: string): Promise<GetDeploymentReviewResponse> {
	try {
		const response = await fetch(`${BASE_URL}/deployment-reviews/${eventId}`, {
			method: "GET",
			headers: getAuthHeaders(token),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: GetDeploymentReviewResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching deployment review:", error);
		throw error;
	}
}

/**
 * Handle SP decision on VIP visit. Requires Auth, Role: sp
 */
export async function handleSPDecision(id: string, data: SPDecisionRequest, token: string): Promise<SPDecisionResponse> {
	try {
		const response = await fetch(`${BASE_URL}/vip-visit/sp-decision/${id}`, {
			method: "POST",
			headers: getAuthHeaders(token),
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: SPDecisionResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error handling SP decision:", error);
		throw error;
	}
}

/**
 * Get SP approved VIP visits. Requires Auth, Role: sp
 */
export async function getSPApprovals(id?: string, token?: string): Promise<VIPVisit | VIPVisit[]> {
	try {
		const url = id ? `${BASE_URL}/vip-visit/sp-approvals/${id}` : `${BASE_URL}/vip-visit/sp-approvals`;
		const response = await fetch(url, {
			method: "GET",
			headers: token ? getAuthHeaders(token) : getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: VIPVisit | VIPVisit[] = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching SP approvals:", error);
		throw error;
	}
}

/**
 * Handle VIP visit decision (SDPO). Requires Auth, Role: sdpo
 */
export async function handleSDPODecision(id: string, data: SDPODecisionRequest, token: string): Promise<SDPODecisionResponse> {
	try {
		const response = await fetch(`${BASE_URL}/vip-visits/${id}/decision`, {
			method: "PATCH",
			headers: getAuthHeaders(token),
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: SDPODecisionResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error handling SDPO decision:", error);
		throw error;
	}
}

/**
 * Allocate officers to VIP visit. Requires Auth, Role: special_branch
 */
export async function allocateOfficersToVIPVisit(id: string, data: AllocateOfficersRequest, token: string): Promise<AllocateOfficersResponse> {
	try {
		const response = await fetch(`${BASE_URL}/allocate-officers/${id}`, {
			method: "POST",
			headers: getAuthHeaders(token),
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: AllocateOfficersResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error allocating officers:", error);
		throw error;
	}
}

/**
 * Get officer allocations. Requires Auth, Role: special_branch
 */
export async function getOfficerAllocations(params?: GetOfficerAllocationsQueryParams, token?: string): Promise<GetOfficerAllocationsResponse> {
	try {
		const queryParams = new URLSearchParams();
		if (params?.allocationId) queryParams.append("allocationId", params.allocationId);
		if (params?.eventId) queryParams.append("eventId", params.eventId);
		if (params?.stationId) queryParams.append("stationId", params.stationId);
		if (params?.rank) queryParams.append("rank", params.rank);
		if (params?.allocatedBy) queryParams.append("allocatedBy", params.allocatedBy);

		const url = `${BASE_URL}/allocate-officers${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
		const response = await fetch(url, {
			method: "GET",
			headers: token ? getAuthHeaders(token) : getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: GetOfficerAllocationsResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error fetching officer allocations:", error);
		throw error;
	}
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

export interface HealthCheckResponse {
	ok: boolean;
}

/**
 * Health check endpoint
 */
export async function healthCheck(): Promise<HealthCheckResponse> {
	try {
		const response = await fetch("/health", {
			method: "GET",
			headers: getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result: HealthCheckResponse = await response.json();
		return result;
	} catch (error) {
		console.error("❌ Error checking health:", error);
		throw error;
	}
}
