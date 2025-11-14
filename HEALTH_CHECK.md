# API Health Check System

## Overview

The health check system monitors all external API endpoints from `rhtechnology.in` and validates their responses against defined Zod schemas. This helps ensure data integrity and API reliability.

## Features

### 🔍 **Comprehensive Monitoring**

-   Tests 15+ external API endpoints
-   Real-time status checking with response times
-   Automatic schema validation using Zod
-   Detailed error reporting and timeout handling

### 📊 **Data Analysis**

-   Shows first 5 JSON data points from each endpoint
-   Compares actual responses against expected schemas
-   Identifies missing fields, extra fields, and type mismatches
-   Provides sample data for debugging

### 🎯 **Three View Modes**

#### 1. Overview Tab

-   Quick status overview of all endpoints
-   Success/failure counts and average response times
-   Color-coded status indicators

#### 2. Details Tab

-   Detailed information for each endpoint
-   Sample data display (first 5 items)
-   Full error messages and response details
-   Endpoint URLs and descriptions

#### 3. Schema Analysis Tab

-   Zod validation results for each endpoint
-   Detailed schema difference analysis
-   Missing fields, extra fields, and type mismatches
-   Validation error messages

## Endpoints Monitored

| Endpoint                            | Description                        | Data Type                  |
| ----------------------------------- | ---------------------------------- | -------------------------- |
| `get-map-data`                      | Main map data with crime incidents | Crime, Police, Emergency   |
| `get-categories-with-subcategories` | Data classification categories     | Categories & Subcategories |
| `get-hospitals`                     | Hospital locations and contacts    | Healthcare Facilities      |
| `get-cctv-locations`                | CCTV camera locations              | Surveillance               |
| `get-atm-locations`                 | ATM locations and status           | Financial Services         |
| `get-bank-locations`                | Bank branch locations              | Financial Services         |
| `get-police-stations`               | Police station locations           | Law Enforcement            |
| `get-procession-routes`             | Festival procession routes         | Event Management           |
| `get-crime-data`                    | Crime incident data                | Law Enforcement            |
| `get-emergency-data`                | Emergency service locations        | Emergency Services         |
| `ai-traffic-monitor`                | AI traffic monitoring              | Traffic Management         |
| `get-accident-csv`                  | Accident data from CSV             | Traffic Safety             |
| `health-check`                      | API health status                  | System Status              |
| `get-gis-features`                  | GIS features and data points       | Geographic Data            |
| `dashboard-stats`                   | Dashboard statistics               | Analytics                  |

## Schema Validation

Each endpoint response is validated against a strict Zod schema that defines:

-   **Required fields** and their types
-   **Optional fields** with default values
-   **Data structure** and nesting
-   **Type constraints** (string, number, boolean, etc.)
-   **Array schemas** for list responses

## Usage

1. **Access the Health Check**: Navigate to `/health` or click "Health Check" in the header
2. **Run Tests**: Click "Refresh" to run all health checks
3. **View Results**: Switch between Overview, Details, and Schema Analysis tabs
4. **Analyze Issues**: Use schema analysis to identify data inconsistencies

## Response Time Monitoring

-   **Fast**: < 1 second (Green)
-   **Medium**: 1-3 seconds (Yellow)
-   **Slow**: > 3 seconds (Red)
-   **Timeout**: > 15 seconds (Red with timeout indicator)

## Error Handling

The system handles various error scenarios:

-   **Network errors**: Connection failures, DNS issues
-   **HTTP errors**: 4xx, 5xx status codes
-   **Timeout errors**: Requests taking > 15 seconds
-   **JSON parsing errors**: Invalid response format
-   **Schema validation errors**: Data structure mismatches

## Technical Implementation

### Files Structure

```
src/
├── lib/
│   └── schemas.ts          # Zod schemas for all endpoints
├── services/
│   └── healthCheck.ts      # Health check service logic
└── app/
    └── health/
        └── page.tsx        # Health check UI component
```

### Key Technologies

-   **Zod**: Runtime type validation
-   **Next.js**: React framework with API routes
-   **Tailwind CSS**: Styling and responsive design
-   **Lucide React**: Icons and visual indicators
-   **Radix UI**: Accessible component primitives

## Monitoring Best Practices

1. **Regular Checks**: Run health checks before deployments
2. **Schema Updates**: Update schemas when API responses change
3. **Error Investigation**: Use detailed error messages to debug issues
4. **Performance Tracking**: Monitor response times for performance issues
5. **Data Validation**: Ensure sample data matches expected structure

## Future Enhancements

-   [ ] Historical trend analysis
-   [ ] Automated alerts for failures
-   [ ] Performance benchmarking
-   [ ] Custom endpoint testing
-   [ ] Export functionality for reports
-   [ ] Integration with monitoring tools
