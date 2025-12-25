# API Documentation

Base URL: `/api`

All authenticated endpoints require JWT token in Authorization header: `Authorization: Bearer <token>`

---

## Authentication

### POST `/api/auth/register`
Register a new user.

**Request Body:**
```typescript
{
  sevarthId: string;        // Required, unique
  password: string;          // Required
  name: string;
  mobile: string;            // Required
  role?: 'admin' | 'sub_admin' | 'police' | 'sp' | 'special_branch'; // Default: 'police'
  psId?: string;             // Required if role is 'police', must be valid ObjectId
  rank?: string;
  badgeNumber?: string;
  otp?: string;
}
```

**Response:** `201 Created`
```typescript
{
  _id: string;
  sevarthId: string;
  name: string;
  mobile: string;
  role: string;
  // ... other fields
}
```

---

### POST `/api/auth/login`
Login with credentials.

**Request Body:**
```typescript
{
  sevarthId: string;         // Required (or email for SDPO)
  password: string;          // Required
}
```

**Response:** `200 OK`
```typescript
{
  authorised: 1;
  msg: string;
  token?: string;            // JWT token
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
  sdpo?: {                    // If logged in as SDPO
    id: string;
    name: string;
    email: string;
    contact_no: string;
    office_address: string;
  };
}
```

---

### POST `/api/auth/send-otp`
Send OTP to registered mobile number.

**Request Body:**
```typescript
{
  sevarthId: string;          // Required
}
```

**Response:** `200 OK`
```typescript
{
  success: boolean;
  msg: string;               // Marathi message
  msgEn: string;             // English message
  maskedMobile: string;      // Masked mobile number
}
```

---

### POST `/api/auth/verify-otp`
Verify OTP and get JWT token.

**Request Body:**
```typescript
{
  sevarthId: string;         // Required
  otp: string;                // Required (hardcoded "1234" for testing)
}
```

**Response:** `200 OK`
```typescript
{
  success: boolean;
  msg: string;
  msgEn: string;
  token: string;              // JWT token
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
```

---

### GET `/api/auth/me`
Get current user profile. **Requires Auth**

**Response:** `200 OK`
```typescript
{
  _id: string;
  sevarthId: string;
  name: string;
  role: string;
  // ... other user fields
}
```

---

### GET `/api/auth/list`
Get list of all police users.

**Response:** `200 OK`
```typescript
Array<{
  _id: string;
  name: string;
}>
```

---

### POST `/api/auth/logout`
Logout (placeholder).

**Response:** `200 OK`
```typescript
{
  msg: 'Logged out';
}
```

---

## Events

### POST `/api/events`
Create a new event. **Requires Auth**

**Request Body:**
```typescript
{
  name: string;               // Required
  description?: string;
  date: string;               // ISO date string
  endDate?: string;           // ISO date string
  location?: string;          // Default: 'Default Location'
  officers?: string[];         // Array of User ObjectIds with role 'police'
}
```

**Response:** `201 Created`
```typescript
{
  msg: string;
  event: Event;
}
```

---

### GET `/api/events`
Get all events with filtering. **Requires Auth**

**Query Parameters:**
- `name?: string` - Filter by event name (regex)
- `location?: string` - Filter by location (regex)
- `dateFrom?: string` - Filter events from date
- `dateTo?: string` - Filter events to date

**Response:** `200 OK`
```typescript
Array<Event & {
  officers: Array<User>;
  createdBy: User;
}>
```

---

### GET `/api/events/:id`
Get event by ID. **Requires Auth**

**Response:** `200 OK`
```typescript
Event & {
  officers: Array<User>;
  createdBy: User;
}
```

---

### PUT `/api/events/:id`
Update event. **Requires Auth**

**Request Body:**
```typescript
{
  name?: string;
  description?: string;
  date?: string;
  endDate?: string;
  location?: string;
  officers?: string[];        // Array of User ObjectIds
}
```

**Response:** `200 OK`
```typescript
Event & {
  officers: Array<User>;
  createdBy: User;
}
```

---

### DELETE `/api/events/:id`
Delete event. **Requires Auth**

**Response:** `200 OK`
```typescript
{
  msg: 'Event deleted';
}
```

---

### GET `/api/events/status/:status`
Get events by status. **Requires Auth**

**Path Parameters:**
- `status: 'pending' | 'approved' | 'rejected'`

**Response:** `200 OK`
```typescript
Array<Event>
```

---

### GET `/api/events/niyojan`
Get approved events for planning. **Requires Auth**

**Response:** `200 OK`
```typescript
Array<Event>
```

---

### PATCH `/api/events/:id/approve`
Approve an event. **Requires Auth, Roles: sub_admin | special_branch | sp**

**Request Body:**
```typescript
{
  comments?: string;
  assignedOfficers?: string[]; // Array of User ObjectIds
}
```

**Response:** `200 OK`
```typescript
{
  msg: string;
  event: Event;
}
```

---

### PATCH `/api/events/:id/reject`
Reject an event. **Requires Auth, Roles: sub_admin | special_branch | sp**

**Request Body:**
```typescript
{
  reason: string;              // Required
  comments?: string;
}
```

**Response:** `200 OK`
```typescript
{
  msg: string;
  event: Event;
}
```

---

### PATCH `/api/events/:id/planning-status`
Update event planning status. **Requires Auth, Roles: sub_admin | special_branch | sp**

**Request Body:**
```typescript
{
  status: 'planning' | 'planned' | 'in_progress' | 'completed';
  comments?: string;
  assignedOfficers?: string[];
}
```

**Response:** `200 OK`
```typescript
{
  msg: string;
  event: Event;
}
```

---

### GET `/api/events/:id/parishishte`
Get event annexures. **Requires Auth**

**Response:** `200 OK`
```typescript
Array<{
  _id: string;
  title: string;
  description: string;
  location: string;
  type: string;
  eventId: string;
  createdAt: Date;
}>
```

---

### POST `/api/events/:id/parishishte`
Create event annexure. **Requires Auth**

**Request Body:**
```typescript
{
  title: string;               // Required
  description: string;         // Required
  location: string;             // Required
  type: string;                // Required
  additionalInfo?: string;
}
```

**Response:** `201 Created`
```typescript
{
  msg: string;
  parishisht: Parishisht;
}
```

---

### GET `/api/events/:id/deployment-officers`
Get deployment officers for event. **Requires Auth**

**Response:** `200 OK`
```typescript
{
  officers: Array<User>;
  coordinationOfficer: User;
}
```

---

## Location

### POST `/api/location/update`
Update officer location. **Requires Auth**

**Request Body:**
```typescript
{
  lat: number;                 // Required
  lng: number;                 // Required
  eventId?: string;
}
```

**Response:** `200 OK`
```typescript
{
  msg: string;
  location: Location;
}
```

---

### GET `/api/location/live/:eventId`
Get live locations for an event.

**Response:** `200 OK`
```typescript
Array<Location & {
  officerId: {
    name: string;
    sevarthId: string;
  };
}>
```

---

## Police Stations

### GET `/api/police/get-stations`
Get all police stations.

**Response:** `200 OK`
```typescript
{
  stations: Array<{
    _id: string;
    name: string;
    name_in_marathi: string;
    division: string;
  }>;
}
```

---

## Officers

### POST `/api/officers`
Add a new officer.

**Request Body:**
```typescript
{
  name: string;                // Required
  rank: string;                 // Required
  badgeNumber: string;           // Required, unique
  mobile: string;                // Required
  psId: string;                 // Required, valid ObjectId
}
```

**Response:** `201 Created`
```typescript
{
  msg: string;
  officer: Officer;
}
```

---

### GET `/api/officers/bystation/:psId`
Get officers by police station ID.

**Response:** `200 OK`
```typescript
{
  count: number;
  officers: Array<Officer & {
    psId: {
      name: string;
    };
  }>;
}
```

---

### POST `/api/officers/vip/:eventId/attendance/:assignmentId`
Mark attendance for VIP visit. **Requires Auth**

**Request Body:**
```typescript
{
  userLatitude: number;         // Required
  userLongitude: number;        // Required
}
```

**Response:** `200 OK`
```typescript
{
  msg: string;
  time: Date;                   // Attendance marked time
}
```

---

## Officers in Police

### GET `/api/officers-in-police`
Get all officers with pagination and filtering.

**Query Parameters:**
- `page?: number` - Page number (default: 1)
- `limit?: number` - Items per page (default: 10)
- `rank?: string` - Filter by rank
- `policeStation?: string` - Filter by police station (regex)
- `specialBranch?: string` - Filter by special branch (regex)
- `isIncharge?: boolean` - Filter by incharge status
- `search?: string` - Search in firstName, lastName, sevrathId, bakkalNumber

**Response:** `200 OK`
```typescript
{
  success: boolean;
  data: Array<OfficersInPolice>;
  pagination: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
}
```

---

### GET `/api/officers-in-police/stats`
Get officers statistics.

**Response:** `200 OK`
```typescript
{
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
```

---

### GET `/api/officers-in-police/incharge`
Get all incharge officers.

**Response:** `200 OK`
```typescript
{
  success: boolean;
  data: Array<OfficersInPolice>;
  count: number;
}
```

---

### GET `/api/officers-in-police/:id`
Get officer by ID.

**Response:** `200 OK`
```typescript
{
  success: boolean;
  data: OfficersInPolice;
}
```

---

### GET `/api/officers-in-police/sevrath/:sevrathId`
Get officer by sevrathId.

**Response:** `200 OK`
```typescript
{
  success: boolean;
  data: OfficersInPolice;
}
```

---

### GET `/api/officers-in-police/rank/:rank`
Get officers by rank.

**Response:** `200 OK`
```typescript
{
  success: boolean;
  data: Array<OfficersInPolice>;
  count: number;
}
```

---

### GET `/api/officers-in-police/station/:station`
Get officers by police station.

**Response:** `200 OK`
```typescript
{
  success: boolean;
  data: Array<OfficersInPolice>;
  count: number;
}
```

---

### POST `/api/officers-in-police`
Create new officer.

**Request Body:**
```typescript
{
  timestamp: string;            // ISO date string, required
  sevrathId: string;            // Required, unique, uppercase
  bakkalNumber?: string;
  firstName: string;             // Required
  middleName?: string;
  lastName: string;              // Required
  rank: string;                  // Required, enum: POLICE_RANKS
  dateOfBirth?: string;         // ISO date string
  dateOfJoining?: string;       // ISO date string
  gender?: 'Male' | 'Female' | 'Other';
  policeStation?: string;
  specialBranch?: string;
  isIncharge?: boolean;         // Default: false
  mobileNumber?: string;         // 10 digits
}
```

**Response:** `201 Created`
```typescript
{
  success: boolean;
  data: OfficersInPolice;
  msg: string;
}
```

---

### PUT `/api/officers-in-police/:id`
Update officer.

**Request Body:** Same as POST (all fields optional)

**Response:** `200 OK`
```typescript
{
  success: boolean;
  data: OfficersInPolice;
  msg: string;
}
```

---

### DELETE `/api/officers-in-police/:id`
Delete officer.

**Response:** `200 OK`
```typescript
{
  success: boolean;
  msg: string;
}
```

---

## Lists

### GET `/api/lists/police-stations`
Get all unique police stations.

**Response:** `200 OK`
```typescript
{
  success: boolean;
  data: string[];               // Sorted alphabetically
  count: number;
}
```

---

### GET `/api/lists/special-units`
Get all unique special units.

**Response:** `200 OK`
```typescript
{
  success: boolean;
  data: string[];               // Sorted alphabetically
  count: number;
}
```

---

### GET `/api/lists/ranks`
Get all unique ranks.

**Response:** `200 OK`
```typescript
{
  success: boolean;
  data: string[];               // Sorted by hierarchy
  count: number;
}
```

---

### GET `/api/lists/all`
Get all lists in one request.

**Response:** `200 OK`
```typescript
{
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
```

---

## Transfer Requests

### GET `/api/transfer-requests/stations`
Get available police stations for transfer.

**Response:** `200 OK`
```typescript
{
  success: boolean;
  data: string[];               // Sorted alphabetically
  count: number;
}
```

---

### GET `/api/transfer-requests`
Get all transfer requests with filtering. **Requires Auth**

**Query Parameters:**
- `status?: 'pending' | 'approved' | 'rejected' | 'cancelled'`
- `officerId?: string` - Filter by officer ObjectId
- `page?: number` - Page number (default: 1)
- `limit?: number` - Items per page (default: 10)

**Response:** `200 OK`
```typescript
{
  success: boolean;
  data: Array<TransferRequest & {
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
  }>;
  pagination: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
}
```

---

### GET `/api/transfer-requests/:id`
Get transfer request by ID. **Requires Auth**

**Response:** `200 OK`
```typescript
{
  success: boolean;
  data: TransferRequest & {
    officerId: Officer;
    requestedBy: User;
    reviewedBy?: User;
  };
}
```

---

### POST `/api/transfer-requests`
Create transfer request. **Requires Auth**

**Request Body:**
```typescript
{
  officerId: string;            // Required, ObjectId
  currentStationId: string;     // Required
  requestedStationId: string;   // Required, must exist in valid stations
  reason: string;               // Required
}
```

**Response:** `201 Created`
```typescript
{
  success: boolean;
  message: string;
  requestId: string;
}
```

---

### PUT `/api/transfer-requests/:id/status`
Update transfer request status. **Requires Auth**

**Request Body:**
```typescript
{
  status: 'approved' | 'rejected' | 'cancelled'; // Required
  reviewComments?: string;
}
```

**Response:** `200 OK`
```typescript
{
  success: boolean;
  message: string;
  data: TransferRequest;
}
```

---

### GET `/api/transfer-requests/stats/overview`
Get transfer request statistics. **Requires Auth**

**Response:** `200 OK`
```typescript
{
  success: boolean;
  data: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    statusDistribution: any;
  };
}
```

---

## Upload

### POST `/api/upload/profile-picture`
Upload profile picture. **Requires Auth**

**Request Body:**
```typescript
{
  imageData: string;            // Required, base64 encoded image
}
```

**Response:** `200 OK`
```typescript
{
  success: boolean;
  msg: string;
  msgEn: string;
  profilePicUrl: string;
  user: User;
}
```

---

### GET `/api/upload/profile`
Get user profile with picture. **Requires Auth**

**Response:** `200 OK`
```typescript
{
  success: boolean;
  user: User & {
    psId?: PoliceStation;
  };
}
```

---

### DELETE `/api/upload/profile-picture`
Delete profile picture. **Requires Auth**

**Response:** `200 OK`
```typescript
{
  success: boolean;
  msg: string;
  msgEn: string;
  user: User;
}
```

---

## Point Allocations

### POST `/api/point-allocations`
Create point allocation. **Requires Auth**

**Request Body:**
```typescript
{
  timestamp?: string;           // ISO date string, default: now
  policeStation: string;        // Required
  festivalEventName: string;   // Required
  sectionAppendix?: string;
  pointName: string;           // Required
  latitude: number;             // Required, -90 to 90
  longitude: number;            // Required, -180 to 180
  eventType?: string;          // Default: 'Festival'
  priority?: string;           // Default: 'Medium'
  status?: string;             // Default: 'Scheduled'
  estimatedCrowd?: number;
  securityLevel?: string;       // Default: 'Medium'
  assignedOfficers?: string[]; // Array of Officer ObjectIds
  notes?: string;
  startDate?: string;          // ISO date string
  endDate?: string;            // ISO date string
}
```

**Response:** `201 Created`
```typescript
{
  msg: string;
  pointAllocation: PointAllocation & {
    assignedOfficers: Array<Officer>;
  };
}
```

---

### GET `/api/point-allocations`
Get all point allocations with filtering. **Requires Auth**

**Query Parameters:**
- `policeStation?: string` - Filter by police station (regex)
- `festivalEventName?: string` - Filter by event name (regex)
- `pointName?: string` - Filter by point name (regex)
- `eventType?: string` - Filter by event type
- `status?: string` - Filter by status
- `priority?: string` - Filter by priority
- `dateFrom?: string` - Filter from date
- `dateTo?: string` - Filter to date
- `page?: number` - Page number (default: 1)
- `limit?: number` - Items per page (default: 50)

**Response:** `200 OK`
```typescript
{
  pointAllocations: Array<PointAllocation & {
    assignedOfficers: Array<Officer>;
    createdBy: User;
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}
```

---

### GET `/api/point-allocations/upcoming`
Get upcoming events. **Requires Auth**

**Response:** `200 OK`
```typescript
Array<PointAllocation>
```

---

### GET `/api/point-allocations/location`
Get point allocations by location (within radius). **Requires Auth**

**Query Parameters:**
- `lat: number` - Latitude (required)
- `lng: number` - Longitude (required)
- `radius?: number` - Radius in km (default: 1)

**Response:** `200 OK`
```typescript
Array<PointAllocation>
```

---

### GET `/api/point-allocations/police-station/:station`
Get point allocations by police station. **Requires Auth**

**Query Parameters:**
- `status?: string` - Filter by status

**Response:** `200 OK`
```typescript
Array<PointAllocation>
```

---

### GET `/api/point-allocations/:id`
Get point allocation by ID. **Requires Auth**

**Response:** `200 OK`
```typescript
PointAllocation & {
  assignedOfficers: Array<Officer>;
  createdBy: User;
  updatedBy?: User;
}
```

---

### PUT `/api/point-allocations/:id`
Update point allocation. **Requires Auth**

**Request Body:** Same as POST (all fields optional)

**Response:** `200 OK`
```typescript
PointAllocation
```

---

### DELETE `/api/point-allocations/:id`
Delete point allocation. **Requires Auth**

**Response:** `200 OK`
```typescript
{
  msg: string;
}
```

---

### POST `/api/point-allocations/bulk-upload`
Bulk upload point allocations. **Requires Auth**

**Request Body:**
```typescript
{
  pointAllocations: Array<PointAllocationData>; // Required, non-empty array
}
```

**Response:** `200 OK`
```typescript
{
  msg: string;
  results: {
    total: number;
    success: number;
    failed: number;
    errors: Array<{
      index: number;
      error: string;
      data: any;
    }>;
  };
}
```

---

## Officer Allocation

### POST `/api/officer-allocation/submit`
Submit officer allocation request. **Requires Auth, Roles: user | sub_admin | sdpo | special_branch | sp**

**Request Body:**
```typescript
{
  eventDetails: {
    eventName?: string;         // Default: 'Bandobast Event'
    description?: string;
    eventDate?: string;         // ISO date string
    endDate?: string;           // ISO date string
    location?: string;
    sensitivity?: string;       // Default: 'medium'
  };
  officerData: {                // Required, Map of rank to gender breakdown
    [rank: string]: {
      male: number;
      female: number;
      total: number;
    };
  };
  totalManpower?: number;
  createdBy?: string;            // ObjectId, default: current user
}
```

**Response:** `201 Created`
```typescript
{
  success: boolean;
  msg: string;
  event: {
    id: string;
    name: string;
    date: Date;
    location: string;
    officerRequirements: any;
    totalManpowerRequired: number;
    status: string;
    createdBy: User;
    createdAt: Date;
  };
}
```

---

### GET `/api/officer-allocation/requests`
Get officer allocation requests by user. **Requires Auth, Roles: user | sub_admin | sdpo | special_branch | sp**

**Query Parameters:**
- `status?: string` - Filter by status
- `limit?: number` - Items per page (default: 10)
- `page?: number` - Page number (default: 1)

**Response:** `200 OK`
```typescript
{
  success: boolean;
  events: Array<Event & {
    createdBy: User;
    approvedBy?: User;
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

---

### GET `/api/officer-allocation/available-officers`
Get available officers by rank and gender. **Requires Auth, Roles: user | sub_admin | sdpo | special_branch | sp**

**Query Parameters:**
- `rank?: string` - Filter by rank
- `gender?: string` - Filter by gender
- `stationId?: string` - Filter by station ID

**Response:** `200 OK`
```typescript
{
  success: boolean;
  officers: Array<Officer>;
  total: number;
  filters: {
    rank: string;
    gender: string;
    stationId: string;
    stationName: string;
  };
}
```

---

### POST `/api/officer-allocation/assign/:eventId`
Assign specific officers to event. **Requires Auth, Roles: sub_admin | sdpo | special_branch | sp**

**Request Body:**
```typescript
{
  assignedOfficers: Array<{     // Required
    officerId: string;          // ObjectId
    rank: string;
    gender: 'male' | 'female';
    location?: string;
  }>;
}
```

**Response:** `200 OK`
```typescript
{
  success: boolean;
  msg: string;
  event: {
    id: string;
    name: string;
    assignedOfficers: Array<Assignment>;
    planningStatus: string;
  };
}
```

---

### GET `/api/officer-allocation/event/:eventId`
Get event officer allocation details. **Requires Auth, Roles: user | sub_admin | sdpo | special_branch | sp**

**Response:** `200 OK`
```typescript
{
  success: boolean;
  event: {
    id: string;
    name: string;
    description: string;
    date: Date;
    endDate?: Date;
    location: string;
    sensitivity: string;
    status: string;
    planningStatus: string;
    officerRequirements: any;
    totalManpowerRequired: number;
    assignedOfficers: Array<Assignment>;
    createdBy: User;
    approvedBy?: User;
    createdAt: Date;
    updatedAt: Date;
  };
}
```

---

## VIP Visits

### POST `/api/vip-visits`
Create VIP visit. **Requires Auth**

**Request Body:**
```typescript
{
  eventType?: string;           // Default: 'VIP Visit'
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
```

**Response:** `201 Created`
```typescript
{
  msg: string;
  visit: VIPVisit;
}
```

---

### GET `/api/vip-visits`
Get all VIP visits with filtering. **Requires Auth**

**Query Parameters:**
- `date?: string` - Filter by date
- `title?: string` - Filter by title (regex)
- `createdBy?: string` - Filter by creator ObjectId
- `reviewStatus?: string` - Filter by review status
- `page?: number` - Page number (default: 1)
- `limit?: number` - Items per page (default: 10)

**Response:** `200 OK`
```typescript
{
  total: number;
  page: number;
  limit: number;
  pages: number;
  visits: Array<VIPVisit & {
    reviewStatus: string;
  }>;
}
```

---

### GET `/api/vip-visits/:id`
Get VIP visit by ID. **Requires Auth**

**Response:** `200 OK`
```typescript
VIPVisit & {
  policeStation: PoliceStation;
  createdBy: User;
  approvedBy?: User;
  dsbApprovedBy?: User;
  assignedOfficers: Array<{
    userId: User;
    stationId: PoliceStation;
  }>;
}
```

---

### POST `/api/vip-visits/:id/assign-officers`
Assign officers to VIP visit. **Requires Auth**

**Request Body:**
```typescript
{
  officers: Array<{             // Required
    userId: string;            // ObjectId
    stationId: string;         // ObjectId, must match user's psId
    rank: string;
  }>;
}
```

**Response:** `200 OK`
```typescript
{
  msg: string;
  assignedOfficers: Array<Assignment>;
}
```

---

### GET `/api/vip-visits/:id/assigned-officers`
Get assigned officers for VIP visit. **Requires Auth**

**Query Parameters:**
- `stationId?: string` - Filter by station
- `rank?: string` - Filter by rank
- `userId?: string` - Filter by user

**Response:** `200 OK`
```typescript
{
  eventId: string;
  assignedCount: number;
  officers: Array<Assignment>;
}
```

---

### GET `/api/vip-visits/:id/assigned-officers/:assignmentId`
Get assigned officer by ID. **Requires Auth**

**Response:** `200 OK`
```typescript
Assignment
```

---

### PATCH `/api/vip-visits/:eventId/assigned-officers/:officerId/location`
Update officer location for VIP visit. **Requires Auth**

**Request Body:**
```typescript
{
  location?: string;
  latitude?: number;
  longitude?: number;
}
```

**Response:** `200 OK`
```typescript
{
  msg: string;
  assignment: Assignment;
}
```

---

### GET `/api/vip-visits/information/assigned`
Get assigned VIP visits for current police officer. **Requires Auth, Role: police**

**Response:** `200 OK`
```typescript
{
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
```

---

### GET `/api/vip-visits/assigned/:id`
Get VIP visit assignment by ID for current user. **Requires Auth**

**Response:** `200 OK`
```typescript
{
  _id: string;
  title: string;
  date: string;
  location: string;
  policeStation: PoliceStation;
  assignment: Assignment;
}
```

---

### POST `/api/deployment-review/:eventId`
Review deployment request. **Requires Auth, Role: sp**

**Request Body:**
```typescript
{
  comment?: string;
  status: string;              // Required
}
```

**Response:** `200 OK`
```typescript
{
  msg: string;
  review: DeploymentReview;
}
```

---

### GET `/api/deployment-reviews/:eventId`
Get review for VIP visit. **Requires Auth**

**Response:** `200 OK`
```typescript
DeploymentReview & {
  reviewedBy: User;
}
```

---

### POST `/api/vip-visit/sp-decision/:id`
Handle SP decision on VIP visit. **Requires Auth, Role: sp**

**Request Body:**
```typescript
{
  status: 'approved' | 'rejected'; // Required
  comment?: string;
}
```

**Response:** `200 OK`
```typescript
{
  msg: string;
  visit: VIPVisit;
}
```

---

### GET `/api/vip-visit/sp-approvals/:id?`
Get SP approved VIP visits. **Requires Auth, Role: sp**

**Path Parameters:**
- `id?: string` - Optional, get specific visit by ID

**Response:** `200 OK`
```typescript
VIPVisit | Array<VIPVisit>
```

---

### PATCH `/api/vip-visits/:id/decision`
Handle VIP visit decision (SDPO). **Requires Auth, Role: sdpo**

**Request Body:**
```typescript
{
  status: 'approved' | 'rejected'; // Required
  comment?: string;
}
```

**Response:** `200 OK`
```typescript
{
  msg: string;
  visit: VIPVisit;
}
```

---

### POST `/api/allocate-officers/:id`
Allocate officers to VIP visit. **Requires Auth, Role: special_branch**

**Request Body:**
```typescript
{
  allocations: Array<{          // Required
    stationId: string;          // ObjectId
    rank: string;
    count: number;
  }>;
  remarks?: string;
}
```

**Response:** `201 Created`
```typescript
{
  msg: string;
  allocations: Array<OfficerAllocation>;
}
```

---

### GET `/api/allocate-officers`
Get officer allocations. **Requires Auth, Role: special_branch**

**Query Parameters:**
- `allocationId?: string` - Get specific allocation
- `eventId?: string` - Filter by event
- `stationId?: string` - Filter by station
- `rank?: string` - Filter by rank
- `allocatedBy?: string` - Filter by allocator

**Response:** `200 OK`
```typescript
{
  msg: string;
  allocation?: OfficerAllocation;
  count?: number;
  allocations?: Array<OfficerAllocation>;
}
```

---

## Health Check

### GET `/health`
Health check endpoint.

**Response:** `200 OK`
```typescript
{
  ok: true;
}
```

---

## Data Types

### User
```typescript
{
  _id: string;
  sevarthId: string;           // Unique
  name: string;
  mobile: string;
  role: 'admin' | 'sub_admin' | 'police' | 'sp' | 'special_branch';
  password: string;             // Hashed
  designation?: string;
  rank: string;
  badgeNumber: string;
  psId?: string;               // ObjectId reference to PoliceStation
  sdpoId?: string;              // ObjectId reference to SDPO
  profilePicUrl?: string;
  profilePicKey?: string;
  otp?: string;
  otpExpiresAt?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Event
```typescript
{
  _id: string;
  name: string;
  description?: string;
  date: Date;
  endDate?: Date;
  location: string;
  createdBy: string;            // ObjectId reference to User
  officers: string[];           // Array of User ObjectIds
  status: 'pending' | 'approved' | 'rejected';
  planningStatus?: 'planning' | 'planned' | 'in_progress' | 'completed';
  approvedAt?: Date;
  approvedBy?: string;          // ObjectId reference to User
  approvalComments?: string;
  rejectedAt?: Date;
  rejectedBy?: string;          // ObjectId reference to User
  rejectionReason?: string;
  rejectionComments?: string;
  officerRequirements?: Map<string, {
    male: number;
    female: number;
    total: number;
  }>;
  totalManpowerRequired?: number;
  assignedOfficers?: Array<{
    officerId: string;          // ObjectId reference to Officer
    rank: string;
    gender: 'male' | 'female';
    location?: string;
    assignedBy: string;         // ObjectId reference to User
    assignedAt: Date;
    status: 'assigned' | 'confirmed' | 'absent';
  }>;
  planningUpdatedAt?: Date;
  planningUpdatedBy?: string;  // ObjectId reference to User
  planningComments?: string;
  planningOfficers?: string[];  // Array of User ObjectIds
  createdAt: Date;
  updatedAt: Date;
}
```

### OfficersInPolice
```typescript
{
  _id: string;
  timestamp: Date;
  sevrathId: string;            // Required, unique, uppercase
  bakkalNumber?: string;
  firstName: string;             // Required
  middleName?: string;
  lastName: string;               // Required
  rank: string;                  // Required, enum: POLICE_RANKS
  dateOfBirth?: Date;
  dateOfJoining?: Date;
  gender?: 'Male' | 'Female' | 'Other';
  policeStation?: string;
  specialBranch?: string;
  isIncharge: boolean;            // Default: false
  mobileNumber?: string;          // 10 digits
  name: string;                   // Virtual: firstName + middleName + lastName
  badgeNumber: string;            // Virtual: bakkalNumber || sevrathId
  createdAt: Date;
  updatedAt: Date;
}
```

### VIPVisit
```typescript
{
  _id: string;
  eventType: string;             // Default: 'VIP Visit'
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  location: string;
  purpose?: string;
  createdBy: string;              // ObjectId reference to User
  policeStation: string;          // ObjectId reference to PoliceStation, required
  sdpo_id?: string;              // ObjectId reference to SDPO
  officerSummary?: Array<{
    rank: string;
    count: number;
  }>;
  assignedOfficers: Array<{
    userId: string;               // ObjectId reference to User, required
    stationId: string;            // ObjectId reference to PoliceStation, required
    rank: string;                // Required
    location?: string;
    latitude?: number;
    longitude?: number;
    assignedAt: Date;
    attendanceMarkedAt?: Date;
  }>;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;            // ObjectId reference to SDPO
  sdpoComment?: string;
  dsbStatus: 'pending' | 'approved' | 'rejected';
  dsbApprovedBy?: string;         // ObjectId reference to User
  dsbRemarks?: string;
  spStatus: 'pending' | 'approved' | 'rejected';
  spComment?: string;
  spApprovedBy?: string;          // ObjectId reference to User
  createdAt: Date;
  updatedAt: Date;
}
```

### PointAllocation
```typescript
{
  _id: string;
  timestamp: Date;
  policeStation: string;
  festivalEventName: string;
  sectionAppendix?: string;
  pointName: string;
  latitude: number;               // -90 to 90
  longitude: number;              // -180 to 180
  eventType: string;              // Default: 'Festival'
  priority: string;               // Default: 'Medium'
  status: string;                 // Default: 'Scheduled'
  estimatedCrowd?: number;
  securityLevel: string;           // Default: 'Medium'
  assignedOfficers: string[];      // Array of Officer ObjectIds
  notes?: string;
  startDate?: Date;
  endDate?: Date;
  createdBy: string;               // ObjectId reference to User
  updatedBy?: string;              // ObjectId reference to User
  createdAt: Date;
  updatedAt: Date;
}
```

### TransferRequest
```typescript
{
  _id: string;
  officerId: string;               // ObjectId reference to OfficersInPolice
  currentStationId: string;
  requestedStationId: string;
  reason: string;
  requestedBy: string;             // ObjectId reference to User
  requestDate: Date;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewedBy?: string;             // ObjectId reference to User
  reviewDate?: Date;
  reviewComments?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### PoliceStation
```typescript
{
  _id: string;
  name: string;
  name_in_marathi: string;
  division: string;
  address?: string;
  sdpo_id?: string;               // ObjectId reference to SDPO
}
```

### Officer
```typescript
{
  _id: string;
  name: string;
  rank: string;
  badgeNumber: string;            // Unique
  mobile: string;
  psId: string;                    // ObjectId reference to PoliceStation
}
```

---

## Error Responses

All endpoints may return the following error responses:

**401 Unauthorized**
```typescript
{
  msg: string;
  // Additional debug info may be included
}
```

**403 Forbidden**
```typescript
{
  msg: string;
  details?: string;
  requiredRoles?: string[];
  userRole?: string;
}
```

**404 Not Found**
```typescript
{
  msg: string;
  success?: boolean;
}
```

**400 Bad Request**
```typescript
{
  msg: string;
  success?: boolean;
  error?: string;
}
```

**500 Internal Server Error**
```typescript
{
  msg: string;
  success?: boolean;
  error?: string;
}
```

---

## Authentication

Most endpoints require authentication via JWT token. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Token is obtained from:
- `/api/auth/login` - Returns token for non-police roles
- `/api/auth/verify-otp` - Returns token after OTP verification

Token expires in:
- Login: 1 day
- OTP verification: 7 days

---

## Role-Based Access

Different endpoints require different roles:

- **user**: Basic user access
- **police**: Police officer access
- **sub_admin**: Sub-admin access
- **sdpo**: SDPO (Sub-Divisional Police Officer) access
- **special_branch**: Special Branch access
- **sp**: Superintendent of Police access
- **admin**: Admin access

Some endpoints use `authorizeRoles()` middleware to restrict access to specific roles.

