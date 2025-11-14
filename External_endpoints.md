# RHTechnology.in API Endpoints Documentation

This document provides a comprehensive list of all API endpoints from `rhtechnology.in` that are being used in the Nashik GIS system, including their query parameters, data shapes, and response formats.

## Base URL

```
https://rhtechnology.in/nashik-gis/app.php
```

---

## 1. Main Map Data Endpoint

### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=get-map-data
```

### Query Parameters

-   `category_id` (optional): Filter by specific category ID
-   `subcategory_id` (optional): Filter by specific subcategory ID
-   `limit` (optional): Limit number of results returned

### Response Structure

```json
{
  "success": boolean,
  "data_points": [
    {
      "id": string,
      "name": string,
      "description": string,
      "latitude": string|number,
      "longitude": string|number,
      "category_name": string,
      "category_color": string,
      "address": string,
      "user_name": string,
      "image_url": string,
      "crime_number": string,
      "created_at": string,
      "status": string
    }
  ],
  "crime_data": array,
  "procession_routes": array
}
```

### Data Categories

-   **Crime Incidents** (2,380 points) - RED markers
-   **Emergency Services/Dial 112** (25 points) - BLUE markers (category: "आपत्कालीन सेवा")
-   **Police Stations** (179 points) - GREEN markers (category: "पोलीस आस्थापना")
-   **Infrastructure** - YELLOW markers
-   **CCTV/Surveillance** - ORANGE markers

---

## 2. Categories and Subcategories

### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=get-categories-with-subcategories
```

### Query Parameters

None

### Response Structure

```json
{
  "success": boolean,
  "categories": [
    {
      "id": string,
      "name": string,
      "color": string,
      "subcategories": [
        {
          "id": string,
          "name": string,
          "category_id": string
        }
      ]
    }
  ]
}
```

---

## 3. Hospital Locations

### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=get-hospitals
```

### Query Parameters

None

### Response Structure

```json
{
  "success": boolean,
  "data": [
    {
      "id": string|number,
      "name": string,
      "hospital_name": string,
      "latitude": string|number,
      "longitude": string|number,
      "address": string,
      "contact_number": string,
      "phone": string,
      "type": string,
      "specialties": string,
      "is_active": boolean,
      "ward": string
    }
  ]
}
```

---

## 4. CCTV Locations

### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=get-cctv-locations
```

### Query Parameters

None

### Response Structure

```json
{
  "success": boolean,
  "data": [
    {
      "id": string|number,
      "name": string,
      "location_name": string,
      "latitude": string|number,
      "longitude": string|number,
      "address": string,
      "location": string,
      "camera_type": string,
      "type": string,
      "is_working": boolean,
      "ward": string,
      "installation_date": string
    }
  ]
}
```

---

## 5. ATM Locations

### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=get-atm-locations
```

### Query Parameters

None

### Response Structure

```json
{
  "success": boolean,
  "data": [
    {
      "id": string|number,
      "bank_name": string,
      "name": string,
      "latitude": string|number,
      "longitude": string|number,
      "address": string,
      "is_working": boolean,
      "ward": string
    }
  ]
}
```

---

## 6. Bank Locations

### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=get-bank-locations
```

### Query Parameters

None

### Response Structure

```json
{
  "success": boolean,
  "data": [
    {
      "id": string|number,
      "bank_name": string,
      "name": string,
      "branch_name": string,
      "branch": string,
      "latitude": string|number,
      "longitude": string|number,
      "address": string,
      "ifsc_code": string,
      "ifsc": string,
      "contact_number": string,
      "phone": string,
      "is_active": boolean,
      "ward": string
    }
  ]
}
```

---

## 7. Police Stations

### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=get-police-stations
```

### Query Parameters

None

### Response Structure

```json
{
  "success": boolean,
  "data": [
    {
      "id": string|number,
      "name": string,
      "latitude": string|number,
      "longitude": string|number,
      "address": string,
      "contact_number": string,
      "phone": string,
      "type": string,
      "is_active": boolean,
      "ward": string
    }
  ]
}
```

---

## 8. Procession/Festival Routes

### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=get-procession-routes
```

### Query Parameters

None

### Response Structure

```json
{
  "success": boolean,
  "routes": [
    {
      "id": string|number,
      "route_name": string,
      "name": string,
      "festival_name": string,
      "type": string,
      "waypoints": string|array,
      "coordinates": string|array,
      "is_active": boolean,
      "assigned_officer": string,
      "officer": string,
      "last_updated": string
    }
  ],
  "data": array,
  "festivals": object
}
```

---

## 9. Crime Data

### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=get-crime-data
```

### Query Parameters

None

### Response Structure

```json
{
  "success": boolean,
  "data": [
    {
      "id": string|number,
      "category": string,
      "category_name": string,
      "description": string,
      "name": string,
      "latitude": string|number,
      "longitude": string|number,
      "address": string,
      "ward": string,
      "status": string,
      "user_name": string,
      "category_color": string,
      "image_url": string,
      "crime_number": string,
      "created_at": string
    }
  ]
}
```

---

## 10. Emergency Data

### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=get-emergency-data
```

### Query Parameters

None

### Response Structure

```json
{
  "success": boolean,
  "data": [
    {
      "id": string|number,
      "name": string,
      "description": string,
      "type": string,
      "latitude": string|number,
      "longitude": string|number,
      "address": string,
      "contact_number": string,
      "phone": string,
      "is_active": boolean,
      "ward": string
    }
  ]
}
```

---

## 11. AI Traffic Monitor

### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=ai-traffic-monitor
```

### Query Parameters

-   `_` (optional): Timestamp parameter to prevent caching

### Response Structure

```json
{
  "success": boolean,
  "nodes": [
    {
      "id": number,
      "node_id": string,
      "name": string,
      "latitude": string,
      "longitude": string,
      "node_type": string,
      "capacity": number,
      "is_active": number,
      "created_at": string
    }
  ],
  "alerts": [
    {
      "id": string,
      "type": string,
      "severity": string,
      "node": object,
      "data": {
        "congestionLevel": number,
        "averageSpeed": number,
        "vehicleCount": number
      },
      "message": string,
      "recommendations": array,
      "timestamp": string
    }
  ],
  "predictions": object,
  "timestamp": string
}
```

---

## 12. Accident CSV Data

### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=get-accident-csv
```

### Query Parameters

None

### Response Structure

```json
{
  "success": boolean,
  "items": [
    {
      "latitude": number,
      "longitude": number,
      "description": string,
      "date": string,
      "severity": number
    }
  ],
  "error": string
}
```

---

## 13. Boundary Files (GeoJSON)

### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=get-boundary-file
```

### Query Parameters

-   `type`: Required. Value: "geojson"
-   `file`: Required. Options:
    -   `nashik-gramin-boundary`
    -   `police-station-boundaries`
    -   `village-boundaries`

### Response Structure

Returns GeoJSON formatted boundary data

---

## 14. KML Boundary Files

### Endpoint (Direct KML file access)

```
GET https://rhtechnology.in/nashik-gis/kml/nashik-gramin-boundary.kml
```

### Query Parameters

None

### Response Structure

Returns KML formatted boundary data

---

## Proxy Endpoints (Local Server)

The application also uses local proxy endpoints to avoid CORS issues:

### Categories Proxy

```
GET /api/external/categories
```

Proxies to: `https://rhtechnology.in/nashik-gis/app.php?endpoint=get-categories-with-subcategories`

### Map Data Proxy

```
GET /api/external/map-data
```

Proxies to: `https://rhtechnology.in/nashik-gis/app.php?endpoint=get-map-data`

**Query Parameters**: Same as original endpoint (`category_id`, `subcategory_id`, `limit`)

---

## Data Processing Notes

1. **Coordinates**: All latitude/longitude values are returned as strings and need to be parsed to numbers
2. **Success Field**: All endpoints return a `success` boolean field to indicate request status
3. **Data Arrays**: Most endpoints return data in a `data` array, except main map data which uses `data_points`
4. **Error Handling**: Failed requests may return HTML instead of JSON, requiring validation
5. **Timeouts**: Default timeout is 10-12 seconds for most endpoints
6. **Caching**: Some endpoints use cache-busting with timestamp parameters
7. **Authentication**: No authentication required for these endpoints
8. **Rate Limiting**: No explicit rate limiting mentioned, but recommended to use reasonable intervals

---

## 15. Authentication & User Management

### 15.1. User Login

#### Endpoint

```
POST https://rhtechnology.in/nashik-gis/app.php?endpoint=login
```

#### Query Parameters

-   `phone` (required): User phone number (cleaned automatically - removes +91, spaces, dashes)
-   `password` (required): User password (hashed verification)

#### Response Structure

```json
{
  "success": boolean,
  "message": string,
  "user": {
    "id": number,
    "name": string,
    "email": string,
    "phone": string,
    "role": string,
    "police_station": string
  },
  "user_id": number
}
```

#### Behavior Notes

-   Phone number is automatically cleaned (removes +91, spaces, dashes)
-   Password verification using PHP password_verify()
-   Returns user data without password field
-   Handles empty password cases with admin contact message

---

### 15.2. User Registration

#### Endpoint

```
POST https://rhtechnology.in/nashik-gis/app.php?endpoint=register
```

#### Query Parameters

-   `name` (required): Full name of user
-   `phone` (required): Phone number
-   `email` (optional): Email address
-   `password` (required): Password (will be hashed)
-   `role` (optional): User role (default: 'user')
-   `police_station` (optional): Associated police station

#### Response Structure

```json
{
  "success": boolean,
  "message": string,
  "user_id": number
}
```

---

### 15.3. Force Login (Test Mode)

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=force-login
```

#### Query Parameters

-   `phone` (required): Phone number to force login

#### Response Structure

```json
{
  "success": boolean,
  "message": string,
  "user": object,
  "user_id": number
}
```

#### Behavior Notes

-   **WARNING**: Bypasses password verification (TEST MODE ONLY)
-   Should be removed in production

---

### 15.4. Reset Password

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=reset-password
```

#### Query Parameters

-   `phone` (required): User phone number
-   `new_password` (optional): New password (default: 'test123')

#### Response Structure

```json
{
  "success": boolean,
  "message": string,
  "new_password": string
}
```

---

### 15.5. Change Password

#### Endpoint

```
POST https://rhtechnology.in/nashik-gis/app.php?endpoint=change-password
```

#### Query Parameters

-   `user_id` (required): User ID
-   `old_password` (required): Current password
-   `new_password` (required): New password

#### Response Structure

```json
{
  "success": boolean,
  "message": string
}
```

---

### 15.6. Get User Profile

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=get-profile
```

#### Query Parameters

-   `user_id` (required): User ID

#### Response Structure

```json
{
  "success": boolean,
  "user": {
    "id": number,
    "name": string,
    "email": string,
    "phone": string,
    "role": string,
    "police_station": string,
    "created_at": string
  }
}
```

---

### 15.7. Update User Profile

#### Endpoint

```
POST https://rhtechnology.in/nashik-gis/app.php?endpoint=update-profile
```

#### Query Parameters

-   `user_id` (required): User ID
-   `name` (optional): Updated name
-   `email` (optional): Updated email
-   `phone` (optional): Updated phone

#### Response Structure

```json
{
  "success": boolean,
  "message": string
}
```

---

### 15.8. Create User (Admin)

#### Endpoint

```
POST https://rhtechnology.in/nashik-gis/app.php?endpoint=create-user
```

#### Query Parameters

-   `name` (required): User name
-   `phone` (required): Phone number
-   `email` (optional): Email address
-   `password` (required): Password
-   `role` (optional): User role
-   `police_station` (optional): Police station

#### Response Structure

```json
{
  "success": boolean,
  "message": string,
  "user_id": number
}
```

---

## 16. Map & GIS Data Management

### 16.1. Get GIS Features

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=get-gis-features
```

#### Query Parameters

-   `category_id` (optional): Filter by category ID
-   `subcategory_id` (optional): Filter by subcategory ID
-   `limit` (optional): Limit number of results

#### Response Structure

```json
{
  "success": boolean,
  "features": [
    {
      "id": number,
      "name": string,
      "description": string,
      "latitude": number,
      "longitude": number,
      "category_name": string,
      "category_color": string,
      "address": string,
      "created_at": string,
      "status": string
    }
  ]
}
```

---

### 16.2. Get GIS Features (Fixed)

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=get-gis-features-fixed
```

#### Query Parameters

-   `category_id` (optional): Filter by category ID
-   `bounds` (optional): Geographic bounds filter

#### Response Structure

```json
{
  "success": boolean,
  "features": array,
  "total_count": number
}
```

#### Behavior Notes

-   Enhanced version with better error handling
-   Includes total count of features

---

### 16.3. Get GIS Categories

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=get-gis-categories
```

#### Query Parameters

None

#### Response Structure

```json
{
  "success": boolean,
  "categories": [
    {
      "id": number,
      "name": string,
      "color": string,
      "icon": string,
      "count": number
    }
  ]
}
```

---

### 16.4. Get GIS Bounds

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=get-gis-bounds
```

#### Query Parameters

None

#### Response Structure

```json
{
  "success": boolean,
  "bounds": {
    "min_lat": number,
    "max_lat": number,
    "min_lng": number,
    "max_lng": number,
    "total_features": number
  }
}
```

#### Behavior Notes

-   Returns geographic bounds of all GIS features
-   Useful for map initialization and zoom levels

---

### 16.5. Upload GIS Layer

#### Endpoint

```
POST https://rhtechnology.in/nashik-gis/app.php?endpoint=upload-gis-layer
```

#### Query Parameters

-   `layer_name` (required): Name of the layer
-   `layer_type` (optional): Type of layer (default: 'geojson')
-   `category` (optional): Layer category

#### Request Body

-   `layer_file` (required): File upload (GeoJSON, KML, etc.)

#### Response Structure

```json
{
  "success": boolean,
  "id": number,
  "message": string
}
```

#### Behavior Notes

-   Supports GeoJSON, KML file uploads
-   Files stored in uploads/layers/ directory
-   Creates database record for layer management

---

### 16.6. Get GIS Layers

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=get-gis-layers
```

#### Query Parameters

None

#### Response Structure

```json
{
  "success": boolean,
  "layers": [
    {
      "id": number,
      "layer_name": string,
      "layer_type": string,
      "category": string,
      "file_path": string,
      "is_active": boolean,
      "style": object,
      "created_at": string
    }
  ]
}
```

---

### 16.7. Toggle Layer

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=toggle-layer
```

#### Query Parameters

-   `id` (required): Layer ID

#### Response Structure

```json
{
  "success": boolean
}
```

#### Behavior Notes

-   Toggles layer active/inactive status
-   Used for layer visibility control

---

### 16.8. Delete Layer

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=delete-layer
```

#### Query Parameters

-   `id` (required): Layer ID

#### Response Structure

```json
{
  "success": boolean
}
```

#### Behavior Notes

-   Deletes both file and database record
-   Permanently removes layer data

---

## 17. Categories & Subcategories

### 17.1. Get Categories

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=get-categories
```

#### Query Parameters

None

#### Response Structure

```json
{
  "success": boolean,
  "categories": [
    {
      "id": number,
      "name": string,
      "color": string,
      "icon": string
    }
  ]
}
```

#### Behavior Notes

-   Returns only active categories
-   Auto-generates colors and icons if not set
-   Supports Unicode characters for Marathi text

---

### 17.2. Get Subcategories

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=get-subcategories
```

#### Query Parameters

None

#### Response Structure

```json
{
  "success": boolean,
  "subcategories": [
    {
      "id": number,
      "category_id": number,
      "name": string
    }
  ]
}
```

---

## 18. Traffic Management & AI

### 18.1. Log Traffic Alert

#### Endpoint

```
POST https://rhtechnology.in/nashik-gis/app.php?endpoint=log-traffic-alert
```

#### Request Body

```json
{
  "id": string,
  "type": string,
  "severity": string,
  "node": {
    "id": string,
    "name": string,
    "lat": number,
    "lng": number
  },
  "message": string,
  "data": {
    "vehicleCount": number,
    "averageSpeed": number,
    "congestionLevel": number,
    "weather": string
  },
  "recommendations": array
}
```

#### Response Structure

```json
{
  "success": boolean,
  "message": string
}
```

#### Behavior Notes

-   Creates traffic_alerts table if not exists
-   Stores alert data with recommendations
-   Used for traffic monitoring system

---

### 18.2. Get Traffic Analytics

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=get-traffic-analytics
```

#### Query Parameters

None

#### Response Structure

```json
{
  "success": boolean,
  "alert_statistics": [
    {
      "alert_type": string,
      "severity": string,
      "count": number,
      "avg_congestion": number,
      "avg_speed": number
    }
  ],
  "node_statistics": [
    {
      "node_name": string,
      "alert_count": number,
      "avg_congestion": number,
      "last_alert": string
    }
  ],
  "hourly_pattern": [
    {
      "hour": number,
      "alert_count": number,
      "avg_congestion": number
    }
  ],
  "generated_at": string
}
```

#### Behavior Notes

-   Analyzes last 24 hours of traffic data
-   Provides statistical insights and patterns
-   Used for traffic management dashboards

---

### 18.3. Get Traffic Predictions

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=get-traffic-predictions
```

#### Query Parameters

-   `node_id` (optional): Specific traffic node ID
-   `hours` (optional): Hours ahead to predict (default: 2, max: 24)

#### Response Structure

```json
{
  "success": boolean,
  "node_id": string,
  "predictions": [
    {
      "timestamp": string,
      "hour": number,
      "predicted_congestion": number,
      "predicted_speed": number,
      "confidence": number
    }
  ],
  "generated_at": string
}
```

#### Behavior Notes

-   Uses historical data for predictions
-   Generates time-based predictions for future hours
-   Confidence based on sample size

---

### 18.4. Get Real-time Traffic

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=get-real-time-traffic
```

#### Query Parameters

None

#### Response Structure

```json
{
  "success": boolean,
  "traffic_data": [
    {
      "node_id": string,
      "node_name": string,
      "latitude": number,
      "longitude": number,
      "congestion_level": number,
      "average_speed": number,
      "vehicle_count": number,
      "timestamp": string,
      "status": string
    }
  ],
  "timestamp": string
}
```

#### Behavior Notes

-   Simulates real-time traffic data
-   Generates congestion levels based on time patterns
-   Used for live traffic monitoring

---

### 18.5. Traffic Optimization Suggestions

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=traffic-optimization-suggestions
```

#### Query Parameters

-   `node_id` (required): Traffic node ID

#### Response Structure

```json
{
  "success": boolean,
  "node_id": string,
  "suggestions": array,
  "recent_alerts_count": number
}
```

#### Behavior Notes

-   Analyzes recent alerts for optimization
-   Generates AI-powered suggestions
-   Based on last 2 hours of data

---

### 18.6. Traffic Heatmap

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=traffic-heatmap
```

#### Query Parameters

-   `date` (optional): Specific date (default: today)

#### Response Structure

```json
{
  "success": boolean,
  "heatmap_data": array,
  "timestamp": string
}
```

#### Behavior Notes

-   Generates heatmap data for traffic visualization
-   Shows congestion patterns over time

---

## 19. Crime Data Management

### 19.1. Save Crime

#### Endpoint

```
POST https://rhtechnology.in/nashik-gis/app.php?endpoint=save-crime
```

#### Query Parameters

-   `user_id` (required): User ID
-   `crime_number` (optional): Crime case number
-   `police_station` (optional): Police station name
-   `crime_type` (required): Type of crime
-   `description` (required): Crime description
-   `latitude` (required): Crime location latitude
-   `longitude` (required): Crime location longitude
-   `location` (optional): Location name
-   `crime_date` (optional): Date of crime (default: current date)

#### Request Body

-   `image` (optional): Image file upload

#### Response Structure

```json
{
  "success": boolean,
  "message": string,
  "crime_id": number
}
```

#### Behavior Notes

-   Creates crime_data table if not exists
-   Handles image uploads to local storage
-   Stores crime data with location coordinates

---

### 19.2. Save Historical Crime

#### Endpoint

```
POST https://rhtechnology.in/nashik-gis/app.php?endpoint=save-historical-crime
```

#### Query Parameters

-   `user_id` (optional): User ID (default: 1)
-   `incident_date` (optional): Incident date (default: current date)
-   `crime_type` (required): Type of crime
-   `place` (required): Crime location
-   `description` (required): Crime description
-   `latitude` (optional): Latitude (default: 0)
-   `longitude` (optional): Longitude (default: 0)
-   `image_url` (optional): Image URL

#### Request Body

-   `image` (optional): Image file upload

#### Response Structure

```json
{
  "success": boolean,
  "message": string,
  "crime_id": number
}
```

---

### 19.3. Crime Analytics

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=crime-analytics
```

#### Query Parameters

-   `date_from` (optional): Start date
-   `date_to` (optional): End date
-   `police_station` (optional): Filter by police station

#### Response Structure

```json
{
  "success": boolean,
  "analytics": {
    "total_crimes": number,
    "crimes_by_type": array,
    "crimes_by_location": array,
    "crimes_by_date": array,
    "top_police_stations": array
  }
}
```

---

### 19.4. Check Crime Table

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=check-crime-table
```

#### Query Parameters

None

#### Response Structure

```json
{
  "success": boolean,
  "message": string,
  "columns": array
}
```

#### Behavior Notes

-   Creates crime_data table if not exists
-   Returns table structure information
-   Used for database setup verification

---

## 20. Procession Routes & Festivals

### 20.1. Save Procession Route

#### Endpoint

```
POST https://rhtechnology.in/nashik-gis/app.php?endpoint=save-procession-route
```

#### Query Parameters

-   `user_id` (required): User ID
-   `police_station` (required): Police station name
-   `festival_name` (required): Festival name
-   `start_point_lat` (required): Start point latitude
-   `start_point_lng` (required): Start point longitude
-   `end_point_lat` (required): End point latitude
-   `end_point_lng` (required): End point longitude
-   `route_coordinates` (required): JSON array of route coordinates
-   `total_distance` (optional): Total route distance
-   `status` (optional): Route status (default: 'pending')

#### Response Structure

```json
{
  "success": boolean,
  "message": string,
  "route_id": number
}
```

---

### 20.2. Get Procession Routes

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=get-procession-routes
```

#### Query Parameters

-   `status` (optional): Filter by status
-   `police_station` (optional): Filter by police station

#### Response Structure

```json
{
  "success": boolean,
  "routes": [
    {
      "id": number,
      "route_name": string,
      "festival_name": string,
      "police_station": string,
      "start_point_lat": number,
      "start_point_lng": number,
      "end_point_lat": number,
      "end_point_lng": number,
      "route_coordinates": array,
      "total_distance": number,
      "status": string,
      "created_at": string
    }
  ]
}
```

---

### 20.3. Get Route Gap Analysis

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=get-route-gap-analysis
```

#### Query Parameters

-   `route_id` (required): Route ID to analyze

#### Response Structure

```json
{
  "success": boolean,
  "analysis": {
    "route_id": number,
    "gaps": array,
    "recommendations": array,
    "coverage_percentage": number
  }
}
```

#### Behavior Notes

-   Analyzes route coverage and identifies gaps
-   Provides recommendations for improvement
-   Calculates coverage percentage

---

### 20.4. Get Festivals

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=get-festivals
```

#### Query Parameters

None

#### Response Structure

```json
{
  "success": boolean,
  "festivals": [
    {
      "id": number,
      "name": string
    }
  ]
}
```

#### Behavior Notes

-   Returns list of available festivals
-   Creates festivals table if not exists
-   Includes fallback data if table empty

---

## 21. Police Stations & Villages

### 21.1. Get Police Stations

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=get-police-stations
```

#### Query Parameters

-   `active_only` (optional): Return only active stations (default: true)

#### Response Structure

```json
{
  "success": boolean,
  "data": [
    {
      "id": number,
      "name": string,
      "latitude": number,
      "longitude": number,
      "address": string,
      "contact_number": string,
      "type": string,
      "is_active": boolean,
      "ward": string
    }
  ]
}
```

---

### 21.2. Update Police Station

#### Endpoint

```
POST https://rhtechnology.in/nashik-gis/app.php?endpoint=update-police-station
```

#### Query Parameters

-   `id` (required): Station ID
-   `name` (optional): Station name
-   `latitude` (optional): Latitude
-   `longitude` (optional): Longitude
-   `address` (optional): Address
-   `contact_number` (optional): Contact number
-   `is_active` (optional): Active status

#### Response Structure

```json
{
  "success": boolean,
  "message": string
}
```

---

### 21.3. Get Villages

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=get-villages
```

#### Query Parameters

-   `station_id` (optional): Filter by police station ID
-   `search` (optional): Search term

#### Response Structure

```json
{
  "success": boolean,
  "villages": [
    {
      "id": number,
      "name": string,
      "station_id": number,
      "station_name": string,
      "latitude": number,
      "longitude": number
    }
  ]
}
```

---

### 21.4. Add Village

#### Endpoint

```
POST https://rhtechnology.in/nashik-gis/app.php?endpoint=add-village
```

#### Query Parameters

-   `name` (required): Village name
-   `station_id` (required): Police station ID
-   `latitude` (optional): Latitude
-   `longitude` (optional): Longitude

#### Response Structure

```json
{
  "success": boolean,
  "message": string,
  "village_id": number
}
```

---

## 22. Data Points Management

### 22.1. Create Data Point

#### Endpoint

```
POST https://rhtechnology.in/nashik-gis/app.php?endpoint=create-data-point
```

#### Query Parameters

-   `user_id` (required): User ID
-   `name` (required): Data point name
-   `latitude` (required): Latitude
-   `longitude` (required): Longitude
-   `category_id` (required): Category ID
-   `description` (optional): Description
-   `subcategory_id` (optional): Subcategory ID
-   `accuracy` (optional): GPS accuracy
-   `altitude` (optional): Altitude
-   `address` (optional): Address

#### Request Body

-   `image` (optional): Image file upload

#### Response Structure

```json
{
  "success": boolean,
  "data_point_id": number
}
```

#### Behavior Notes

-   Handles image uploads to local storage
-   Creates data_points table record
-   Validates required fields

---

### 22.2. Get Data Points

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=data-points
```

#### Query Parameters

-   `user_id` (optional): Filter by user ID
-   `category_id` (optional): Filter by category
-   `status` (optional): Filter by status
-   `limit` (optional): Limit results

#### Response Structure

```json
{
  "success": boolean,
  "data_points": [
    {
      "id": number,
      "name": string,
      "latitude": number,
      "longitude": number,
      "category_name": string,
      "description": string,
      "address": string,
      "image_url": string,
      "status": string,
      "created_at": string
    }
  ]
}
```

---

### 22.3. Get Single Data Point

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=get-point
```

#### Query Parameters

-   `id` (required): Data point ID

#### Response Structure

```json
{
  "success": boolean,
  "data_point": object
}
```

---

### 22.4. Delete Data Point

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=delete-point
```

#### Query Parameters

-   `id` (required): Data point ID

#### Response Structure

```json
{
  "success": boolean,
  "message": string
}
```

---

### 22.5. Update Data Point Status

#### Endpoint

```
POST https://rhtechnology.in/nashik-gis/app.php?endpoint=update-status
```

#### Query Parameters

-   `id` (required): Data point ID
-   `status` (required): New status

#### Response Structure

```json
{
  "success": boolean,
  "message": string
}
```

---

### 22.6. Get User History

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=user-history
```

#### Query Parameters

-   `user_id` (required): User ID
-   `limit` (optional): Limit results

#### Response Structure

```json
{
  "success": boolean,
  "history": [
    {
      "id": number,
      "action": string,
      "data_point_id": number,
      "created_at": string
    }
  ]
}
```

---

## 23. Dashboard & Analytics

### 23.1. Dashboard Stats

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=dashboard-stats
```

#### Query Parameters

None

#### Response Structure

```json
{
  "success": boolean,
  "stats": {
    "total_data_points": number,
    "total_crimes": number,
    "total_routes": number,
    "active_users": number,
    "recent_activity": array
  }
}
```

---

### 23.2. Dashboard Analytics

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=dashboard-analytics
```

#### Query Parameters

-   `date_from` (optional): Start date
-   `date_to` (optional): End date

#### Response Structure

```json
{
  "success": boolean,
  "analytics": {
    "data_points_by_category": array,
    "crimes_by_type": array,
    "user_activity": array,
    "geographic_distribution": array
  }
}
```

---

### 23.3. Mobile Dashboard

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=mobile-dashboard
```

#### Query Parameters

-   `user_id` (required): User ID

#### Response Structure

```json
{
  "success": boolean,
  "dashboard": {
    "user_stats": object,
    "recent_activity": array,
    "quick_actions": array
  }
}
```

---

### 23.4. Station Statistics

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=station-statistics
```

#### Query Parameters

-   `station_id` (optional): Police station ID

#### Response Structure

```json
{
  "success": boolean,
  "statistics": {
    "total_crimes": number,
    "total_routes": number,
    "coverage_area": number,
    "efficiency_metrics": object
  }
}
```

---

### 23.5. User Statistics

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=user-statistics
```

#### Query Parameters

-   `user_id` (optional): User ID

#### Response Structure

```json
{
  "success": boolean,
  "statistics": {
    "data_points_created": number,
    "crimes_reported": number,
    "routes_planned": number,
    "activity_score": number
  }
}
```

---

## 24. Emergency & Mobile

### 24.1. Mobile Quick Report

#### Endpoint

```
POST https://rhtechnology.in/nashik-gis/app.php?endpoint=mobile-quick-report
```

#### Request Body

```json
{
  "user_id": number,
  "incident_type": string,
  "latitude": number,
  "longitude": number,
  "description": string,
  "severity": string,
  "image_url": string
}
```

#### Response Structure

```json
{
  "success": boolean,
  "report_id": number,
  "message": string
}
```

#### Behavior Notes

-   Quick incident reporting for mobile users
-   Triggers AI analysis automatically
-   Stores in quick_reports table

---

### 24.2. Emergency Response

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=emergency-response
```

#### Query Parameters

-   `latitude` (required): Emergency location latitude
-   `longitude` (required): Emergency location longitude
-   `type` (optional): Emergency type

#### Response Structure

```json
{
  "success": boolean,
  "response": {
    "nearest_police_station": object,
    "nearest_hospital": object,
    "estimated_response_time": number,
    "emergency_contacts": array
  }
}
```

---

## 25. System & Admin

### 25.1. Health Check

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=health-check
```

#### Query Parameters

None

#### Response Structure

```json
{
	"success": true,
	"message": "API working"
}
```

---

### 25.2. Get Logs

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=get-logs
```

#### Query Parameters

None

#### Response Structure

```json
{
  "success": boolean,
  "logs": string
}
```

#### Behavior Notes

-   Returns route_errors.log content
-   Used for debugging and monitoring

---

### 25.3. Bulk Approve

#### Endpoint

```
POST https://rhtechnology.in/nashik-gis/app.php?endpoint=bulk-approve
```

#### Query Parameters

-   `type` (required): Type to approve ('crime_data', 'procession_routes', 'data_points', 'all')
-   `station` (optional): Police station filter

#### Response Structure

```json
{
  "success": boolean,
  "message": string,
  "affected_rows": number
}
```

#### Behavior Notes

-   Approves multiple records at once
-   Uses database transactions
-   Supports filtering by police station

---

### 25.4. Setup Directories

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=setup-directories
```

#### Query Parameters

None

#### Response Structure

```json
{
  "success": boolean,
  "message": string,
  "directories_created": array
}
```

#### Behavior Notes

-   Creates necessary upload directories
-   Used for system initialization

---

### 25.5. View Error Logs

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=view-error-logs
```

#### Query Parameters

-   `type` (optional): Log type filter

#### Response Structure

```json
{
  "success": boolean,
  "logs": array
}
```

---

### 25.6. Check Update

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=check-update
```

#### Query Parameters

None

#### Response Structure

```json
{
  "success": boolean,
  "update_available": boolean,
  "current_version": string,
  "latest_version": string,
  "download_url": string,
  "file_size": number,
  "release_date": string,
  "update_required": boolean,
  "update_optional": boolean,
  "changelog": array,
  "release_notes": string,
  "server_time": string
}
```

#### Behavior Notes

-   Mobile app update checking
-   Returns version information and download links
-   Supports Marathi changelog

---

### 25.7. Stats

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=stats
```

#### Query Parameters

None

#### Response Structure

```json
{
  "success": boolean,
  "stats": {
    "total_users": number,
    "total_data_points": number,
    "total_crimes": number,
    "total_routes": number,
    "system_uptime": string
  }
}
```

---

## 26. Debug/Test Endpoints

### 26.1. Debug Login

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=debug-login
```

#### Query Parameters

-   `phone` (required): Phone number to debug
-   `password` (optional): Password to verify

#### Response Structure

```json
{
  "user_found": boolean,
  "user_id": number,
  "name": string,
  "phone_in_db": string,
  "has_password": boolean,
  "password_length": number,
  "password_starts_with": string,
  "password_verified": boolean,
  "searched_phone": string,
  "existing_phones": array
}
```

#### Behavior Notes

-   **DEBUG ONLY**: Shows detailed login debugging info
-   Should be removed in production

---

### 26.2. App Login Test

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=app-login-test
```

#### Query Parameters

None

#### Response Structure

```json
{
	"success": true,
	"message": "Login successful",
	"user": {
		"id": 4,
		"name": "Test User",
		"phone": "8983839143"
	},
	"user_id": 4
}
```

#### Behavior Notes

-   **TEST ONLY**: Always returns success with test user
-   Logs all request data for debugging

---

### 26.3. Debug GIS Data

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=debug-gis-data
```

#### Query Parameters

-   `category_id` (optional): Category filter

#### Response Structure

```json
{
  "success": boolean,
  "debug_info": object,
  "data": array
}
```

---

### 26.4. Test GIS Markers

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=test-gis-markers
```

#### Query Parameters

None

#### Response Structure

```json
{
  "success": boolean,
  "markers": array
}
```

---

### 26.5. Test Crime Save

#### Endpoint

```
POST https://rhtechnology.in/nashik-gis/app.php?endpoint=test-crime-save
```

#### Query Parameters

-   `test_data` (optional): Test data to save

#### Response Structure

```json
{
  "success": boolean,
  "message": string,
  "test_id": number
}
```

---

### 26.6. Test Procession Save

#### Endpoint

```
POST https://rhtechnology.in/nashik-gis/app.php?endpoint=test-procession-save
```

#### Query Parameters

-   `test_route` (optional): Test route data

#### Response Structure

```json
{
  "success": boolean,
  "message": string,
  "route_id": number
}
```

---

### 26.7. Debug

#### Endpoint

```
GET https://rhtechnology.in/nashik-gis/app.php?endpoint=debug
```

#### Query Parameters

-   `action` (optional): Debug action to perform

#### Response Structure

```json
{
  "success": boolean,
  "debug_info": object
}
```

---

## Usage Statistics

-   **Total Data Points**: 8,057+ across all categories
-   **Main Categories**: Crime (2,380), Police Stations (179), Emergency Services (25)
-   **Update Frequency**: Real-time for traffic data, periodic for other datasets
-   **Geographic Coverage**: Nashik region, Maharashtra, India
-   **Total Endpoints**: 60+ documented endpoints
-   **Authentication**: Phone-based login system
-   **File Uploads**: Supports images, GeoJSON, KML files
-   **AI Features**: Traffic monitoring, optimization suggestions, predictions
