# Smart Area-Based Search Feature

## Overview
The search system now intelligently detects when users are searching for data within specific KML boundary areas and automatically filters results to show only points within that geographic region.

## 🎯 Use Cases

### Example Queries

Users can now search using natural language like:

1. **"accidents in [village name]"**
   - Shows all accident points within that village boundary
   
2. **"dial 112 calls in [area name]"**
   - Shows emergency calls within that area
   
3. **"show me accidents near [place]"**
   - Finds accidents in the boundary containing or near that place

4. **"emergency in [village]"**
   - Shows Dial 112 calls in that village

## 🔍 How It Works

### 1. **Natural Language Processing**

The system uses regex patterns to detect area-based queries:

```typescript
const areaPatterns = [
  /(?:accidents?|accident points?)\s+(?:in|at|near)\s+(.+)/i,
  /(?:dial\s*112|emergency calls?)\s+(?:in|at|near)\s+(.+)/i,
  /(?:show|find|get)\s+(?:me\s+)?(?:accidents?|dial\s*112|emergency)\s+(?:in|at|near)\s+(.+)/i,
  /(?:in|at|near)\s+(.+)\s+(?:accidents?|dial\s*112|emergency)/i,
];
```

**Matches queries like:**
- "accidents in Manmad"
- "dial 112 calls at Gangapur"
- "show me emergencies near Niphad"
- "in Sinnar accidents"

### 2. **Data Type Detection**

The system determines what type of data to filter:

```typescript
if (normalizedQuery.includes('accident')) {
  dataType = 'accident';  // Filter accident records
} else if (normalizedQuery.includes('dial') || normalizedQuery.includes('112') || normalizedQuery.includes('emergency')) {
  dataType = 'dial112';    // Filter emergency calls
} else {
  dataType = 'all';        // Show all types
}
```

### 3. **Boundary Lookup**

Uses the `findBoundaryByName()` utility to match the area name:

```typescript
// Smart matching: supports partial names, case-insensitive
targetBoundary = findBoundaryByName(areaName, kmlFeatures);
// Example: "manmad" matches "Manmad Village" boundary
```

### 4. **Point-in-Polygon Filtering**

Uses the Ray Casting algorithm to check if points fall within boundaries:

```typescript
const accidentsInArea = filterPointsInBoundary(
  accidents.map(a => ({
    ...a,
    lat: parseFloat(a.latitude),
    lng: parseFloat(a.longitude),
  })),
  targetBoundary
);
```

### 5. **Smart Data Loading**

- **Lazy loads KML features** only when needed for area searches
- **Caches KML boundaries** to avoid redundant parsing
- **Fetches accident/dial112 data** on-demand if not already loaded

## 📊 Search Results

### Summary Result

When matches are found, a summary is shown first:

```
📍 Manmad Village
Found 15 accidents in this area
Type: Area Summary
```

### Individual Results

Each filtered point is shown with context:

```
Accident: Vehicle Collision
Manmad Village - 2024-12-25
Type: Accident
```

### No Results

If no data found in the area:

```
No accidents found
in Manmad Village
Type: Info
```

## 🛠️ Technical Implementation

### Files Modified

1. **`src/app/page.tsx`** (Lines 151-434)
   - Enhanced `handleSearch()` with area detection
   - Added KML features caching
   - Integrated point-in-polygon filtering

2. **`src/utils/geoUtils.ts`** (New file)
   - Point-in-polygon algorithm (Ray Casting)
   - Boundary search by name
   - Point filtering utilities
   - Distance calculations

### Key Functions

#### `isPointInPolygon(point, polygon)`
```typescript
// Checks if a lat/lng point is inside a polygon boundary
isPointInPolygon(
  { lat: 20.5934, lng: 74.0765 },
  manmadBoundary.coordinates
) 
// Returns: true/false
```

#### `findBoundaryByName(name, features)`
```typescript
// Finds KML boundary by name (case-insensitive, partial match)
findBoundaryByName("manmad", kmlFeatures)
// Returns: KMLFeature or null
```

#### `filterPointsInBoundary(points, boundary)`
```typescript
// Filters array of points to only those inside boundary
filterPointsInBoundary(allAccidents, manmadBoundary)
// Returns: Array of accidents in Manmad
```

## 🎨 User Experience Flow

```mermaid
graph TD
    A[User types query] --> B{Contains area pattern?}
    B -->|Yes| C[Extract area name]
    B -->|No| Z[Normal search]
    C --> D{KML features loaded?}
    D -->|No| E[Load KML from file]
    D -->|Yes| F[Use cached features]
    E --> G[Find boundary by name]
    F --> G
    G --> H{Boundary found?}
    H -->|Yes| I[Determine data type]
    H -->|No| J[Show "No boundary found"]
    I --> K{Need accidents?}
    K -->|Yes| L[Fetch accident data]
    K -->|No| M{Need Dial 112?}
    L --> N[Filter points in boundary]
    M -->|Yes| O[Fetch Dial 112 data]
    M -->|No| P[Skip]
    O --> N
    N --> Q[Show results with summary]
    Z --> R[Traditional search results]
```

## 💡 Examples

### Query: "accidents in Manmad"

**Processing:**
1. Detects area-based search
2. Extracts area name: "Manmad"
3. Finds "Manmad Village" boundary in KML
4. Loads all accident records (if not cached)
5. Filters accidents using point-in-polygon
6. Returns 15 accidents with coordinates inside Manmad boundary

**Results:**
```
📍 Manmad Village
Found 15 accidents in this area

Accident: Hit and Run
Manmad Village - 2024-12-20

Accident: Vehicle Collision  
Manmad Village - 2024-12-18
...
```

### Query: "dial 112 calls in Gangapur"

**Processing:**
1. Detects emergency call search
2. Finds "Gangapur" boundary
3. Loads Dial 112 records
4. Filters to 23 calls within boundary

**Results:**
```
📍 Gangapur
Found 23 emergency calls in this area

Emergency Call: Medical Emergency
Gangapur - 2024-12-25

Emergency Call: Fire
Gangapur - 2024-12-24
...
```

## 🚀 Performance

### Optimizations

1. **Lazy Loading**: KML features only loaded when area search detected
2. **Caching**: Once loaded, features remain in state for subsequent searches
3. **Data Reuse**: Accident/Dial112 data fetched once and reused
4. **Early Return**: Area search results bypass normal search to save processing

### Memory Usage

- **KML Features**: ~50-200KB (depending on boundary complexity)
- **Cached in state**: Persists for session duration
- **Cleared on**: Page refresh

## 🔮 Future Enhancements

### Planned Features

1. **Multi-area search**: "accidents in Manmad and Gangapur"
2. **Time-based filtering**: "accidents in Manmad last week"
3. **Comparison queries**: "compare accidents in Manmad vs Sinnar"
4. **Heatmap generation**: "show accident hotspots in Manmad"
5. **Export results**: "export accidents in Gangapur to CSV"

### Additional Data Types

Could extend to support:
- CCTV cameras in area
- Police stations in area
- Hospitals in area
- Banks/ATMs in area
- Procession routes through area

## 🐛 Error Handling

### Boundary Not Found

If the searched area name doesn't match any KML boundary:

```
console.log("⚠️ No boundary found for: [area name]")
// Falls back to normal search
```

### KML Load Failure

If KML file fails to load:

```typescript
catch (error) {
  console.error("Failed to load KML for area search:", error);
  // Gracefully continues with normal search
}
```

### No Data in Area

If boundary found but no accident/emergency points within it:

```
No accidents found
in [Area Name]
```

## 📚 Related Documentation

- [KML Flow Documentation](./.gemini/kml_flow_documentation.md)
- Geospatial Utils: `src/utils/geoUtils.ts`
- KML Parser: `src/utils/kmlParser.ts`
- Search Handler: `src/app/page.tsx` lines 151-434

## 🎓 Developer Notes

### Adding New Data Types

To add support for new data types in area searches:

1. Add pattern to `areaPatterns`:
   ```typescript
   /(?:hospitals?)\s+(?:in|at|near)\s+(.+)/i
   ```

2. Add data type detection:
   ```typescript
   else if (normalizedQuery.includes('hospital')) {
     dataType = 'hospital';
   }
   ```

3. Add filtering logic:
   ```typescript
   if (dataType === 'hospital' || dataType === 'all') {
     const hospitalsInArea = filterPointsInBoundary(
       allHospitals,
       targetBoundary
     );
     // Add to results
   }
   ```

### Testing Area Searches

Try these test queries:

- ✅ "accidents in Manmad"
- ✅ "dial 112 calls near Gangapur"
- ✅ "show me emergencies in Sinnar"
- ✅ "in Niphad accidents"
- ❌ "manmad" (not area-based, normal search)
- ❌ "accidents" (no area specified, normal search)

---

**Last Updated**: 2024-12-27  
**Version**: 1.0  
**Author**: Nashik GIS Development Team
