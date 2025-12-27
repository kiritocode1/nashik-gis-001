# KML File Integration Flow Documentation

## Overview
This document explains how KML (Keyhole Markup Language) files are loaded, parsed, and displayed in the Nashik GIS application.

## 📁 KML File Location
- **File Path**: `/public/kml/nashik_gramin.kml`
- **Purpose**: Contains village/boundary polygons and police station markers for the Nashik Gramin region

## 🔄 Complete Flow

### 1. **Configuration in `page.tsx`** (Lines 62, 141, 869-871)

```typescript
// State to track KML layer visibility
const [kmlLayerVisible, setKmlLayerVisible] = useState(false); // Starts disabled

// KML file URL (converted to absolute URL for Google Maps API)
const [kmlAbsoluteUrl, setKmlAbsoluteUrl] = useState("/kml/nashik_gramin.kml");

// KML Layer configuration object
const kmlLayerConfig = {
  url: kmlAbsoluteUrl,          // The absolute URL to the KML file
  visible: kmlLayerVisible,      // Controls visibility on the map
};
```

**Key Points:**
- The KML layer starts **disabled by default** (`kmlLayerVisible = false`)
- The URL gets converted to absolute on client mount: `${window.location.origin}/kml/nashik_gramin.kml`

---

### 2. **UI Toggle in Sidebar** (Lines 1984-2003)

The KML toggle appears in the **Map Layers** section of the Sidebar:

```tsx
<div className="flex items-center justify-between cursor-pointer group">
  <div className="flex-1">
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-200">🗺️ KML Boundaries</span>
      <span className={kmlLayerVisible ? "ON" : "OFF"}>
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
```

**Location in UI:**
- Opens via Settings/Categories icon (gear icon) in the Sidebar
- Listed under "Map Layers" section
- Shows ON/OFF status with color-coded indicator (green when ON, gray when OFF)

---

### 3. **Toggle Handler** (Lines 1585-1591)

When user clicks the toggle:

```typescript
const handleKMLToggle = (visible: boolean) => {
  console.log("🔄 Page: KML toggle handler called with:", visible);
  console.log("🔄 Page: Current KML state before toggle:", kmlLayerVisible);
  setKmlLayerVisible(visible);
  console.log("🔄 Page: KML toggle completed, new visible state should be:", visible);
};
```

This handler:
1. Updates the `kmlLayerVisible` state
2. Logs the toggle action for debugging
3. Triggers a re-render with the new visibility state

---

### 4. **Passing to GoogleMap Component** (Lines 2322, 2381)

The config is passed as props:

```tsx
<GoogleMap
  kmlLayer={kmlLayerConfig}
  onKMLToggle={handleKMLToggle}
  // ... other props
/>
```

---

### 5. **KML Parsing** (`src/utils/kmlParser.ts`)

The `GoogleMap` component uses a custom parser instead of Google's native KmlLayer for better control:

```typescript
export async function parseKMLFile(kmlUrl: string, abortSignal?: AbortSignal): Promise<KMLParseResult> {
  // 1. Fetch the KML file
  const response = await fetch(kmlUrl, { signal: abortSignal });
  const kmlText = await response.text();
  
  // 2. Parse XML using DOMParser
  const parser = new DOMParser();
  const kmlDoc = parser.parseFromString(cleanedKmlText, "application/xml");
  
  // 3. Extract features (polygons/boundaries) and markers (police stations)
  const placemarks = kmlDoc.querySelectorAll("Placemark");
  
  // 4. Return structured data
  return {
    features: KMLFeature[],  // Polygons for village boundaries
    markers: KMLMarker[],    // Points for police stations
  };
}
```

**Returns:**
- `features`: Array of polygon/boundary features with coordinates
- `markers`: Array of point markers (police stations) with lat/lng

---

### 6. **Rendering in GoogleMap** (`src/components/GoogleMap.tsx`, Lines 642-750)

The `GoogleMap` component handles the rendering:

```typescript
// State for KML visibility
const [kmlVisible, setKmlVisible] = useState(kmlLayer?.visible ?? false);

// Refs to store rendered map elements
const kmlPolygonsRef = useRef<any[]>([]);
const kmlMarkersRef = useRef<any[]>([]);
const kmlAbortControllerRef = useRef<AbortController | null>(null);

// Effect that runs when KML layer config or visibility changes
useEffect(() => {
  const handleEnhancedKML = async () => {
    // 1. Clear existing KML elements
    kmlPolygonsRef.current.forEach(polygon => polygon.setMap(null));
    kmlMarkersRef.current.forEach(marker => marker.setMap(null));
    
    if (!kmlVisible || !kmlLayer?.url) return;
    
    // 2. Parse the KML file
    const parsed = await parseKMLFile(kmlLayer.url, abortSignal);
    
    // 3. Render polygons (boundaries)
    parsed.features.forEach(feature => {
      const polygon = new google.maps.Polygon({
        paths: feature.coordinates,
        map: mapInstance,
        fillColor: '#00FF00',
        fillOpacity: 0.2,
        strokeColor: '#00FF00',
        strokeWeight: 2,
      });
      kmlPolygonsRef.current.push(polygon);
    });
    
    // 4. Render markers (police stations)
    parsed.markers.forEach(marker => {
      const mapMarker = new google.maps.Marker({
        position: marker.position,
        map: mapInstance,
        title: marker.title,
      });
      kmlMarkersRef.current.push(mapMarker);
    });
  };
  
  handleEnhancedKML();
}, [kmlVisible, kmlLayer?.url]);
```

**Key Features:**
- **Clean-up first**: Always removes existing KML elements before adding new ones
- **Abort support**: Can cancel ongoing KML loads if toggle is switched quickly
- **Custom rendering**: Uses native Google Maps Polygon and Marker APIs for better control
- **Auto-fallback**: If parsing fails, the system gracefully handles the error

---

## 📊 Data Structure

### KMLFeature (Boundaries/Polygons)
```typescript
interface KMLFeature {
  id: string;
  name: string;          // Village/area name
  description?: string;
  coordinates: Array<{lat: number; lng: number}>;  // Polygon boundary points
  properties?: Record<string, any>;
}
```

### KMLMarker (Police Stations)
```typescript
interface KMLMarker {
  id: string;
  title: string;         // Police station name
  description?: string;
  position: { lat: number; lng: number };
  properties?: Record<string, any>;
}
```

---

## 🎯 Use Cases

### 1. **Village Boundary Detection**
The parsed KML features are cached and used to detect which village a point/route belongs to:

```typescript
const findVillageName = (start: {lat, lng}, end: {lat, lng}, features: KMLFeature[]): string | null => {
  // Check if point is inside any polygon boundary
  // Returns village name if found
}
```

### 2. **Police Station Enrichment**
KML markers serve as fallback police station data when API is unavailable:

```typescript
// If API returns no stations, use KML markers
if (policeStations.length === 0 && kmlMarkers) {
  const stationPool = kmlMarkers.map(m => ({
    name: m.title,
    latitude: m.position.lat,
    longitude: m.position.lng
  }));
}
```

---

## 🔧 Technical Details

### Why Custom Parser Instead of Native KmlLayer?

Google Maps has a native `google.maps.KmlLayer`, but this app uses a custom parser because:

1. **Better Control**: Can customize styling, interaction, and behavior
2. **Data Access**: Can access parsed data for other features (village detection, police station lookup)
3. **Offline Capability**: Parser works with local files without external URL requirements
4. **Error Handling**: More granular error handling and fallback options
5. **Performance**: Can implement smart loading/unloading strategies

### Performance Optimizations

```typescript
// AbortController to cancel in-flight requests
const kmlAbortControllerRef = useRef<AbortController | null>(null);

// Cancel previous load if new one starts
if (kmlAbortControllerRef.current) {
  kmlAbortControllerRef.current.abort();
}
kmlAbortControllerRef.current = new AbortController();
```

### Cleanup on Unmount

```typescript
return () => {
  // Clean up map elements
  kmlPolygonsRef.current.forEach(p => p.setMap(null));
  kmlMarkersRef.current.forEach(m => m.setMap(null));
  
  // Cancel any in-flight requests
  if (kmlAbortControllerRef.current) {
    kmlAbortControllerRef.current.abort();
  }
};
```

---

## 📍 File Paths Summary

| Component | File | Purpose |
|-----------|------|---------|
| KML File | `/public/kml/nashik_gramin.kml` | Source data file |
| Parser | `/src/utils/kmlParser.ts` | Parses KML to JS objects |
| Page Logic | `/src/app/page.tsx` | State management & toggle handler |
| Rendering | `/src/components/GoogleMap.tsx` | Displays KML on map |
| UI Toggle | Rendered in `<Sidebar>` component | User control |

---

## 🚀 Adding New KML Features

To add support for new KML files:

1. **Add KML file** to `/public/kml/your-file.kml`
2. **Add state** in `page.tsx`:
   ```typescript
   const [newKmlVisible, setNewKmlVisible] = useState(false);
   ```
3. **Add config object**:
   ```typescript
   const newKmlConfig = { url: '/kml/your-file.kml', visible: newKmlVisible };
   ```
4. **Add toggle in Sidebar** (same pattern as existing KML toggle)
5. **Pass to GoogleMap**:
   ```typescript
   <GoogleMap newKmlLayer={newKmlConfig} />
   ```

---

## 🐛 Debugging Tips

Enable console logs to trace KML flow:

```typescript
// In page.tsx
console.log("🗺️ Page: Rendering with current state:", {
  kmlLayerConfig,
  kmlLayerVisible,
  kmlLayerUrl: kmlLayerConfig.url,
});

// In GoogleMap.tsx
console.log("🎆 KML Effect triggered:", {
  hasKmlLayer: !!kmlLayer,
  kmlVisible,
  kmlUrl: kmlLayer?.url,
});

// In kmlParser.ts
console.log("🔄 Parsing KML file:", kmlUrl);
console.log("✅ KML parsing completed:", {
  featureCount: result.features.length,
  markerCount: result.markers.length,
});
```

---

## ✅ Summary

The KML flow follows this sequence:

1. **User clicks toggle** in Sidebar → `handleKMLToggle()` called
2. **State updates** → `setKmlLayerVisible(true)`
3. **Re-render triggers** → `kmlLayerConfig.visible` becomes `true`
4. **GoogleMap receives** new `kmlLayer` prop
5. **useEffect fires** in GoogleMap component
6. **Parser fetches** and parses `/public/kml/nashik_gramin.kml`
7. **Map elements created** → Polygons and Markers added to map
8. **User sees** green boundaries and police station markers on map

The system is designed to be **modular**, **performant**, and **extensible** for future KML layers.
