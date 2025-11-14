<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

ini_set('max_execution_time', 30);  
ini_set('memory_limit', '128M');   

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, X-API-Key");
    header("Access-Control-Max-Age: 86400");
    exit(0);
}


$method = $_SERVER['REQUEST_METHOD'];


require_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    die(json_encode(['success' => false, 'error' => 'Database connection failed']));
}



$endpoint = $_GET['endpoint'] ?? $_POST['endpoint'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];


function validateAPIKey() {
    $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
    $validKeys = ['your-secure-api-key'];
    return in_array($apiKey, $validKeys);
}

// Restrict CORS to specific domains
$allowedOrigins = ['https://yourdomain.com'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}


function validateUploadedFile($file, $allowedTypes) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    return in_array($mimeType, $allowedTypes);
}


if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get endpoint from POST data if not in GET
    $endpoint = $_GET['endpoint'] ?? $_POST['endpoint'] ?? '';
} else {
    $endpoint = $_GET['endpoint'] ?? '';
}

if ($endpoint == 'save-crime') {
    error_log("Save Crime Request - Method: " . $_SERVER['REQUEST_METHOD']);
    error_log("POST data: " . print_r($_POST, true));
    error_log("FILES data: " . print_r($_FILES, true));
}


if ($endpoint === 'check-update') {
    // Configuration - Update these values when you release new versions
    $config = [
        'latest_version' => '1.1.0',  // Make this higher than your app version
        'build_number' => '2',
        'minimum_supported_version' => '1.0.0',
        'download_url' => 'https://rhtechnology.in/nashik-gis/downloads/gis-app-v1.1.0.apk',
        'file_size' => 25600000,
        'release_date' => '2024-01-15',
        'update_required' => false,
        'changelog' => [
            'नवीन नकाशा वैशिष्ट्ये जोडली',
            'कार्यप्रदर्शन सुधारणा',
            'बग निराकरण'
        ],
        'release_notes' => 'या आवृत्तीमध्ये महत्वपूर्ण सुधारणा आहेत.',
    ];

    $response = [
        'success' => true,
        'update_available' => true,  // Force true for testing
        'current_version' => '1.0.0',
        'latest_version' => $config['latest_version'],
        'download_url' => $config['download_url'],
        'file_size' => $config['file_size'],
        'release_date' => $config['release_date'],
        'update_required' => $config['update_required'],
        'update_optional' => true,
        'changelog' => $config['changelog'],
        'release_notes' => $config['release_notes'],
        'server_time' => date('Y-m-d H:i:s'),
    ];

    echo json_encode($response);
    exit;
}


class TrafficAI {
    private $db;
    
    public function __construct($db) {
        $this->db = $db;
    }
    
    public function analyzeTrafficPattern($nodeId) {
        // Get historical data
        $stmt = $this->db->prepare("
            SELECT AVG(congestion_level) as avg_congestion,
                   AVG(average_speed) as avg_speed,
                   HOUR(timestamp) as hour,
                   DAYOFWEEK(timestamp) as day_of_week
            FROM traffic_realtime
            WHERE node_id = ? AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY HOUR(timestamp), DAYOFWEEK(timestamp)
        ");
        $stmt->execute([$nodeId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function predictCongestion($nodeId, $hoursAhead = 2) {
        $patterns = $this->analyzeTrafficPattern($nodeId);
        $predictions = [];
        
        for ($i = 1; $i <= $hoursAhead; $i++) {
            $futureTime = time() + ($i * 3600);
            $hour = date('G', $futureTime);
            $dayOfWeek = date('w', $futureTime) + 1;
            
            // Find matching pattern
            $matchingPattern = array_filter($patterns, function($p) use ($hour, $dayOfWeek) {
                return $p['hour'] == $hour && $p['day_of_week'] == $dayOfWeek;
            });
            
            if (!empty($matchingPattern)) {
                $pattern = reset($matchingPattern);
                $predictions[] = [
                    'time' => date('Y-m-d H:i:s', $futureTime),
                    'predicted_congestion' => $pattern['avg_congestion'],
                    'predicted_speed' => $pattern['avg_speed'],
                    'confidence' => 85
                ];
            } else {
                // Default prediction based on time
                $predictions[] = $this->getDefaultPrediction($hour, $dayOfWeek, $futureTime);
            }
        }
        
        return $predictions;
    }
    
    private function getDefaultPrediction($hour, $dayOfWeek, $timestamp) {
        $congestion = 2; // Normal
        $speed = 40;
        
        // Rush hour patterns
        if (($hour >= 8 && $hour <= 10) || ($hour >= 17 && $hour <= 20)) {
            $congestion = 4;
            $speed = 25;
        } elseif ($hour >= 12 && $hour <= 14) {
            $congestion = 3;
            $speed = 35;
        } elseif ($hour >= 22 || $hour <= 6) {
            $congestion = 1;
            $speed = 50;
        }
        
        // Weekend adjustment
        if ($dayOfWeek == 1 || $dayOfWeek == 7) {
            $congestion = max(1, $congestion - 1);
            $speed = min(50, $speed + 10);
        }
        
        return [
            'time' => date('Y-m-d H:i:s', $timestamp),
            'predicted_congestion' => $congestion,
            'predicted_speed' => $speed,
            'confidence' => 70
        ];
    }
    
    public function generateOptimization($nodeId, $currentCongestion) {
        $optimizations = [];
        
        if ($currentCongestion >= 4) {
            $optimizations[] = [
                'type' => 'signal_timing',
                'priority' => 'high',
                'suggestion' => 'Increase green signal duration by 20 seconds',
                'expected_improvement' => '15-20% reduction in wait time'
            ];
            
            $optimizations[] = [
                'type' => 'route_diversion',
                'priority' => 'high',
                'suggestion' => 'Activate alternate route signage',
                'expected_improvement' => '25% traffic reduction'
            ];
        }
        
        if ($currentCongestion >= 3) {
            $optimizations[] = [
                'type' => 'traffic_personnel',
                'priority' => 'medium',
                'suggestion' => 'Deploy traffic police at junction',
                'expected_improvement' => '10-15% flow improvement'
            ];
        }
        
        return $optimizations;
    }
}

$trafficAI = new TrafficAI($db);

function extractAndValidateCoordinates($feature) {
    // Method 1: Direct lat/lng fields
    $lat = (float)$feature['latitude'];
    $lng = (float)$feature['longitude'];
    
    if (isValidCoordinate($lat, $lng)) {
        return ['lat' => $lat, 'lng' => $lng, 'source' => 'direct'];
    }
    
    // Method 2: Extract from geometry
    if (!empty($feature['geometry'])) {
        $coords = extractFromGeometry($feature['geometry']);
        if ($coords) {
            return $coords;
        }
    }
    
    return null;
}

function extractFromGeometry($geometry) {
    if (is_string($geometry)) {
        $decoded = json_decode($geometry, true);
        $geometry = $decoded ?: $geometry;
    }
    
    if (is_array($geometry) && isset($geometry['coordinates'])) {
        $coords = $geometry['coordinates'];
        $type = strtolower($geometry['type'] ?? 'point');
        
        switch ($type) {
            case 'point':
                if (count($coords) >= 2) {
                    $lat = (float)$coords[1];
                    $lng = (float)$coords[0];
                    if (isValidCoordinate($lat, $lng)) {
                        return ['lat' => $lat, 'lng' => $lng, 'source' => 'geometry_point'];
                    }
                }
                break;
                
            case 'linestring':
                if (count($coords) > 0 && count($coords[0]) >= 2) {
                    $lat = (float)$coords[0][1];
                    $lng = (float)$coords[0][0];
                    if (isValidCoordinate($lat, $lng)) {
                        return ['lat' => $lat, 'lng' => $lng, 'source' => 'geometry_line'];
                    }
                }
                break;
                
            case 'polygon':
                if (count($coords) > 0 && count($coords[0]) > 0) {
                    // Calculate centroid
                    $centroid = calculatePolygonCentroid($coords[0]);
                    if ($centroid && isValidCoordinate($centroid['lat'], $centroid['lng'])) {
                        return ['lat' => $centroid['lat'], 'lng' => $centroid['lng'], 'source' => 'geometry_polygon'];
                    }
                }
                break;
        }
    }
    
    return null;
}



function calculatePolygonCentroid($points) {
    if (count($points) < 3) return null;
    
    $latSum = 0;
    $lngSum = 0;
    $validPoints = 0;
    
    foreach ($points as $point) {
        if (count($point) >= 2) {
            $latSum += (float)$point[1];
            $lngSum += (float)$point[0];
            $validPoints++;
        }
    }
    
    if ($validPoints > 0) {
        return [
            'lat' => $latSum / $validPoints,
            'lng' => $lngSum / $validPoints
        ];
    }
    
    return null;
}

function isValidCoordinate($lat, $lng) {
    return is_numeric($lat) && is_numeric($lng) && 
           $lat >= -90 && $lat <= 90 && 
           $lng >= -180 && $lng <= 180 &&
           !($lat == 0 && $lng == 0); // Exclude 0,0 coordinates
}

function createSampleGISFeatures() {
    // Create sample GIS features around Nashik
    $categories = ['water', 'building', 'road', 'vegetation', 'boundary'];
    $features = [];
    
    for ($i = 0; $i < 20; $i++) {
        $category = $categories[$i % count($categories)];
        
        $features[] = [
            'id' => 1000 + $i,
            'feature_type' => 'point',
            'category' => $category,
            'name' => "Sample $category " . ($i + 1),
            'description' => "Generated sample feature for testing",
            'latitude' => 19.95 + (rand(-100, 100) / 1000),
            'longitude' => 73.75 + (rand(-100, 100) / 1000),
            'geometry' => null,
            'properties' => ['sample' => true, 'category' => $category],
            'source_file' => 'sample_data',
            'coordinate_source' => 'generated'
        ];
    }
    
    return $features;
}



function getFallbackVillages($station_id) {
    // Station-specific villages based on station ID
    $stationVillages = [
        1 => [ // सायबर
           
            ['id' => 102, 'village_name_marathi' => 'इंदिरानगर', 'village_name' => 'Indira Nagar'],
            ['id' => 103, 'village_name_marathi' => 'गंगापूर रोड', 'village_name' => 'Gangapur Road'],
        ],
        2 => [ // अभोणा
            ['id' => 201, 'village_name_marathi' => 'अभोणा', 'village_name' => 'Abhona'],
            ['id' => 202, 'village_name_marathi' => 'कळवण', 'village_name' => 'Kalwan'],
            ['id' => 203, 'village_name_marathi' => 'नंदूर', 'village_name' => 'Nandur'],
        ],
        3 => [ // आयेशानगर
            ['id' => 301, 'village_name_marathi' => 'आयेशानगर', 'village_name' => 'Ayesha Nagar'],
            ['id' => 302, 'village_name_marathi' => 'मखमलाबाद', 'village_name' => 'Makhmalabad'],
            ['id' => 303, 'village_name_marathi' => 'नवापूरा', 'village_name' => 'Navapura'],
        ],
        4 => [ // आझादनगर
            ['id' => 401, 'village_name_marathi' => 'आझादनगर', 'village_name' => 'Azad Nagar'],
            ['id' => 402, 'village_name_marathi' => 'रामवाडी', 'village_name' => 'Ramwadi'],
            ['id' => 403, 'village_name_marathi' => 'शिवाजीनगर', 'village_name' => 'Shivaji Nagar'],
        ],
        5 => [ // नाशिक शहर
            ['id' => 501, 'village_name_marathi' => 'मुख्य बाजार', 'village_name' => 'Main Market'],
            ['id' => 502, 'village_name_marathi' => 'पंचवटी', 'village_name' => 'Panchavati'],
            ['id' => 503, 'village_name_marathi' => 'त्र्यंबकेश्वर रोड', 'village_name' => 'Trimbakeshwar Road'],
        ],
        6 => [ // नाशिक तालुका
            ['id' => 601, 'village_name_marathi' => 'देवळाली', 'village_name' => 'Deolali'],
            ['id' => 602, 'village_name_marathi' => 'सिन्नर', 'village_name' => 'Sinnar'],
            ['id' => 603, 'village_name_marathi' => 'निफाड', 'village_name' => 'Niphad'],
        ]
    ];
    
    // Return station-specific villages or default
    return $stationVillages[$station_id] ?? [
        ['id' => 001, 'village_name_marathi' => 'मुख्य शहर', 'village_name' => 'Main City'],
        ['id' => 002, 'village_name_marathi' => 'उपनगर', 'village_name' => 'Suburb'],
        ['id' => 003, 'village_name_marathi' => 'ग्रामीण भाग', 'village_name' => 'Rural Area'],
    ];
}


function generateTimeBasedPrediction($hour, $dayOfWeek) {
    $congestion = 1;
    $speed = 45;
    
    // Rush hour patterns
    if (($hour >= 8 && $hour <= 10) || ($hour >= 17 && $hour <= 20)) {
        $congestion = 4;
        $speed = 25;
    } elseif ($hour >= 12 && $hour <= 14) {
        $congestion = 2;
        $speed = 35;
    }
    
    // Weekend adjustments
    if ($dayOfWeek == 1 || $dayOfWeek == 7) { // Sunday or Saturday
        $congestion = max(1, $congestion - 1);
        $speed += 10;
    }
    
    return [
        'avg_congestion' => $congestion,
        'avg_speed' => $speed,
        'sample_size' => 1
    ];
}

function generateCongestionLevel($hour, $nodeId) {
    $baseCongestion = 1;
    
    // Time-based patterns
    if (($hour >= 8 && $hour <= 10) || ($hour >= 17 && $hour <= 20)) {
        $baseCongestion = 4;
    } elseif ($hour >= 12 && $hour <= 14) {
        $baseCongestion = 2;
    }
    
    // Node-specific adjustments
    $nodeMultipliers = [
        'node_1' => 1.2, // Major junction
        'node_2' => 1.5, // Transport hub
        'node_3' => 0.8, // Arterial road
        'node_4' => 1.3, // Industrial zone
        'node_5' => 1.1  // Commercial area
    ];
    
    $multiplier = $nodeMultipliers[$nodeId] ?? 1.0;
    $congestion = $baseCongestion * $multiplier;
    
    // Add random variation
    $congestion *= (0.8 + (mt_rand() / mt_getrandmax()) * 0.4);
    
    return min(5, max(1, round($congestion)));
}

function generateSpeed($congestionLevel) {
    $baseSpeeds = [
        1 => 50, // Free flow
        2 => 40, // Light traffic
        3 => 30, // Moderate
        4 => 20, // Heavy
        5 => 10  // Severe congestion
    ];
    
    $speed = $baseSpeeds[$congestionLevel];
    
    // Add variation
    $variation = $speed * 0.2;
    $speed += mt_rand(-$variation, $variation);
    
    return max(5, round($speed));
}

function generateVehicleCount($hour, $congestionLevel) {
    $baseCount = 50;
    
    // Time multipliers
    if (($hour >= 8 && $hour <= 10) || ($hour >= 17 && $hour <= 20)) {
        $baseCount *= 3;
    } elseif ($hour >= 12 && $hour <= 14) {
        $baseCount *= 1.5;
    }
    
    // Congestion multiplier
    $baseCount *= $congestionLevel * 0.8;
    
    return round($baseCount * (0.7 + (mt_rand() / mt_getrandmax()) * 0.6));
}

function logError($message, $context = []) {
    $logEntry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'message' => $message,
        'context' => $context,
        'endpoint' => $_GET['endpoint'] ?? 'unknown',
        'method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
    ];
    
    $logDir = 'logs';
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $logFile = $logDir . '/api_errors_' . date('Y-m-d') . '.log';
    file_put_contents($logFile, json_encode($logEntry) . "\n", FILE_APPEND | LOCK_EX);
    
    // Also log to PHP error log
    error_log("API Error: $message - Context: " . json_encode($context));
}


function getCongestionStatus($level) {
    $statuses = [
        1 => 'Free Flow',
        2 => 'Light Traffic', 
        3 => 'Moderate Traffic',
        4 => 'Heavy Congestion',
        5 => 'Severe Congestion'
    ];
    
    return $statuses[$level] ?? 'Unknown';
}

function generateOptimizationSuggestions($nodeId, $recentAlerts) {
    $suggestions = [];
    
    if (empty($recentAlerts)) {
        return [
            [
                'type' => 'preventive',
                'priority' => 'low',
                'suggestion' => 'Traffic flow appears normal. Continue monitoring.',
                'implementation' => 'No immediate action required'
            ]
        ];
    }
    
    $avgCongestion = array_sum(array_column($recentAlerts, 'congestion_level')) / count($recentAlerts);
    $alertCount = count($recentAlerts);
    
    // High congestion suggestions
    if ($avgCongestion >= 4) {
        $suggestions[] = [
            'type' => 'signal_optimization',
            'priority' => 'high',
            'suggestion' => 'Optimize traffic signal timing to improve flow',
            'implementation' => 'Extend green light duration by 15-20 seconds for main road',
            'expected_improvement' => '15-25% reduction in wait time'
        ];
        
        $suggestions[] = [
            'type' => 'route_diversion',
            'priority' => 'high', 
            'suggestion' => 'Activate dynamic message signs to divert traffic',
            'implementation' => 'Display alternate route suggestions on VMS boards',
            'expected_improvement' => '20-30% traffic reduction'
        ];
    }
    
    // Frequent alerts suggestions
    if ($alertCount >= 5) {
        $suggestions[] = [
            'type' => 'traffic_management',
            'priority' => 'medium',
            'suggestion' => 'Deploy traffic personnel during peak hours',
            'implementation' => 'Station traffic police at junction during 8-10 AM and 5-8 PM',
            'expected_improvement' => '10-20% improvement in flow'
        ];
    }
    
    // Time-based suggestions
    $currentHour = (int)date('H');
    if ($currentHour >= 7 && $currentHour <= 9) {
        $suggestions[] = [
            'type' => 'public_transport',
            'priority' => 'medium',
            'suggestion' => 'Increase public transport frequency during morning rush',
            'implementation' => 'Add 2-3 additional bus services every 15 minutes',
            'expected_improvement' => '8-12% reduction in private vehicle usage'
        ];
    }
    
    // Infrastructure suggestions
    if ($avgCongestion >= 3) {
        $suggestions[] = [
            'type' => 'infrastructure',
            'priority' => 'low',
            'suggestion' => 'Consider long-term infrastructure improvements',
            'implementation' => 'Plan for additional lanes or flyover construction',
            'expected_improvement' => '40-60% capacity increase (long-term)',
            'timeline' => '12-24 months'
        ];
    }
    
    return $suggestions;
}

function extractCoordinatesFromGeometry($feature) {
    // Try multiple approaches to get coordinates
    
    // 1. Check if latitude/longitude fields are already valid
    $lat = (float)$feature['latitude'];
    $lng = (float)$feature['longitude'];
    
    if ($lat != 0 && $lng != 0 && $lat >= -90 && $lat <= 90 && $lng >= -180 && $lng <= 180) {
        return ['lat' => $lat, 'lng' => $lng];
    }
    
    // 2. Extract from geometry field
    if (!empty($feature['geometry'])) {
        $geometry = $feature['geometry'];
        
        // Try to decode as JSON if it's a string
        if (is_string($geometry)) {
            $decoded = json_decode($geometry, true);
            if ($decoded) {
                $geometry = $decoded;
            }
        }
        
        // Extract coordinates based on geometry type
        if (is_array($geometry) && isset($geometry['coordinates'])) {
            $coords = $geometry['coordinates'];
            
            switch (strtolower($geometry['type'] ?? '')) {
                case 'point':
                    if (is_array($coords) && count($coords) >= 2) {
                        return ['lat' => (float)$coords[1], 'lng' => (float)$coords[0]];
                    }
                    break;
                    
                case 'linestring':
                    if (is_array($coords) && count($coords) > 0 && is_array($coords[0])) {
                        // Use first point of line
                        return ['lat' => (float)$coords[0][1], 'lng' => (float)$coords[0][0]];
                    }
                    break;
                    
                case 'polygon':
                case 'multipolygon':
                    // For polygons, calculate centroid or use first point
                    $points = [];
                    if ($geometry['type'] === 'Polygon' && is_array($coords[0])) {
                        $points = $coords[0];
                    } elseif ($geometry['type'] === 'MultiPolygon' && is_array($coords[0][0])) {
                        $points = $coords[0][0];
                    }
                    
                    if (!empty($points)) {
                        // Calculate centroid
                        $latSum = 0;
                        $lngSum = 0;
                        $count = 0;
                        
                        foreach ($points as $point) {
                            if (is_array($point) && count($point) >= 2) {
                                $latSum += (float)$point[1];
                                $lngSum += (float)$point[0];
                                $count++;
                            }
                        }
                        
                        if ($count > 0) {
                            return ['lat' => $latSum / $count, 'lng' => $lngSum / $count];
                        }
                    }
                    break;
            }
        }
        
        // 3. Try to parse WKT format if it's a string
        if (is_string($geometry)) {
            $coords = parseWKTCoordinates($geometry);
            if ($coords) {
                return $coords;
            }
        }
    }
    
    return null;
}

// Helper function to parse WKT (Well-Known Text) format
function parseWKTCoordinates($wkt) {
    // Handle common WKT formats like "POINT(lng lat)" or "MULTIPOLYGON(((...)))"
    
    // Extract coordinates from POINT
    if (preg_match('/POINT\s*\(\s*([+-]?\d*\.?\d+)\s+([+-]?\d*\.?\d+)\s*\)/', $wkt, $matches)) {
        return ['lat' => (float)$matches[2], 'lng' => (float)$matches[1]];
    }
    
    // Extract first point from LINESTRING
    if (preg_match('/LINESTRING\s*\(\s*([+-]?\d*\.?\d+)\s+([+-]?\d*\.?\d+)/', $wkt, $matches)) {
        return ['lat' => (float)$matches[2], 'lng' => (float)$matches[1]];
    }
    
    // Extract first point from POLYGON
    if (preg_match('/POLYGON\s*\(\s*\(\s*([+-]?\d*\.?\d+)\s+([+-]?\d*\.?\d+)/', $wkt, $matches)) {
        return ['lat' => (float)$matches[2], 'lng' => (float)$matches[1]];
    }
    
    // Extract first point from MULTIPOLYGON
    if (preg_match('/MULTIPOLYGON\s*\(\s*\(\s*\(\s*([+-]?\d*\.?\d+)\s+([+-]?\d*\.?\d+)/', $wkt, $matches)) {
        return ['lat' => (float)$matches[2], 'lng' => (float)$matches[1]];
    }
    
    return null;
}


switch ($endpoint) {
    case 'health-check':
        echo json_encode(['success' => true, 'message' => 'API working']);
        break;
    case 'get-logs':
        $logFile = 'logs/route_errors.log';
        if (file_exists($logFile)) {
            $logs = file_get_contents($logFile);
            echo json_encode(['success' => true, 'logs' => $logs]);
        } else {
            echo json_encode(['success' => true, 'logs' => 'No logs found']);
        }
        break;
        
    case 'test-db-save':
    try {
        $stmt = $db->prepare("INSERT INTO procession_routes 
            (user_id, police_station, festival_name, start_point_lat, start_point_lng, 
             end_point_lat, end_point_lng, route_coordinates, total_distance, status) 
            VALUES (1, 'Test Station', 'Test Festival', 20.0074, 73.7898, 
                    20.0075, 73.7899, '[]', 100, 'pending')");
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Test insert successful']);
        } else {
            echo json_encode(['success' => false, 'error' => $stmt->errorInfo()]);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    break; 
case 'get-categories':
    try {
        $stmt = $db->query("SELECT id, name, color, icon FROM categories WHERE is_active = 1 ORDER BY name");
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Default icon mapping for common categories
        $iconMap = [
            'MIDC' => '🏭',
            'आरोग्य' => '🏥',
            'उद्योग' => '🏭',
            'आपत्कालीन सेवा' => '🚨',
            'व्यवसाय' => '🏪',
            'सार्वजनिक सुविधा' => '🏛️',
            'पर्यावरण' => '🌳',
            'पाणी' => '💧',
            'सुरक्षा' => '🔒',
            'शैक्षणिक' => '🎓',
            'पोलीस' => '👮',
            'वाहतूक' => '🚦',
            'धार्मिक' => '🛕',
            'राजकीय' => '🏛️',
            'महत्वाची' => '⚠️'
        ];
        
        foreach($categories as &$cat) {
            // Try to get icon from map if it's not set properly
            if (empty($cat['icon']) || $cat['icon'] == 'fas' || strlen($cat['icon']) > 2) {
                $cat['icon'] = $iconMap[$cat['name']] ?? '📍';
            }
            
            if (empty($cat['color'])) {
                // Generate a color based on category name
                $colors = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', '#00BCD4', '#8BC34A', '#FFC107'];
                $index = abs(crc32($cat['name'])) % count($colors);
                $cat['color'] = $colors[$index];
            }
        }
        
        echo json_encode([
            'success' => true,
            'categories' => $categories
        ], JSON_UNESCAPED_UNICODE);
    } catch(Exception $e) {
        echo json_encode([
            'success' => false, 
            'message' => 'Error loading categories: ' . $e->getMessage()
        ]);
    }
    break;

case 'get-subcategories':
    try {
        $stmt = $db->query("SELECT id, category_id, name FROM subcategories WHERE is_active = 1 ORDER BY name");
        $subcategories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'subcategories' => $subcategories
        ]);
    } catch(Exception $e) {
        echo json_encode([
            'success' => false, 
            'message' => 'Error loading subcategories: ' . $e->getMessage()
        ]);
    }
    break;   
    
    
case 'log-traffic-alert':
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            echo json_encode(['success' => false, 'error' => 'No data received']);
            break;
        }
        
        try {
            // Create traffic_alerts table if it doesn't exist
            $createTable = "CREATE TABLE IF NOT EXISTS traffic_alerts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                alert_id VARCHAR(255) UNIQUE NOT NULL,
                alert_type VARCHAR(100) NOT NULL,
                severity VARCHAR(20) NOT NULL,
                node_id VARCHAR(50),
                node_name VARCHAR(255),
                node_lat DECIMAL(10, 8),
                node_lng DECIMAL(11, 8),
                message TEXT,
                vehicle_count INT,
                average_speed INT,
                congestion_level INT,
                weather VARCHAR(50),
                recommendations JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )";
            
            $db->exec($createTable);
            
            // Insert alert data
            $stmt = $db->prepare("INSERT INTO traffic_alerts 
                (alert_id, alert_type, severity, node_id, node_name, node_lat, node_lng, 
                 message, vehicle_count, average_speed, congestion_level, weather, recommendations)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            
            $stmt->execute([
                $input['id'],
                $input['type'],
                $input['severity'],
                $input['node']['id'] ?? null,
                $input['node']['name'] ?? null,
                $input['node']['lat'] ?? null,
                $input['node']['lng'] ?? null,
                $input['message'],
                $input['data']['vehicleCount'] ?? null,
                $input['data']['averageSpeed'] ?? null,
                $input['data']['congestionLevel'] ?? null,
                $input['data']['weather'] ?? null,
                json_encode($input['recommendations'] ?? [])
            ]);
            
            echo json_encode(['success' => true, 'message' => 'Alert logged successfully']);
            
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }
    break;
    
    case 'get-traffic-analytics':
    try {
        // Get traffic alert statistics
        $alertStats = $db->query("
            SELECT 
                alert_type,
                severity,
                COUNT(*) as count,
                AVG(congestion_level) as avg_congestion,
                AVG(average_speed) as avg_speed
            FROM traffic_alerts 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            GROUP BY alert_type, severity
            ORDER BY count DESC
        ")->fetchAll(PDO::FETCH_ASSOC);
        
        // Get node-wise statistics
        $nodeStats = $db->query("
            SELECT 
                node_name,
                COUNT(*) as alert_count,
                AVG(congestion_level) as avg_congestion,
                MAX(created_at) as last_alert
            FROM traffic_alerts 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            GROUP BY node_name
            ORDER BY alert_count DESC
        ")->fetchAll(PDO::FETCH_ASSOC);
        
        // Get hourly pattern
        $hourlyPattern = $db->query("
            SELECT 
                HOUR(created_at) as hour,
                COUNT(*) as alert_count,
                AVG(congestion_level) as avg_congestion
            FROM traffic_alerts 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            GROUP BY HOUR(created_at)
            ORDER BY hour
        ")->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'alert_statistics' => $alertStats,
            'node_statistics' => $nodeStats,
            'hourly_pattern' => $hourlyPattern,
            'generated_at' => date('Y-m-d H:i:s')
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    break;
    
    case 'get-emergency-data':
    // Read the Excel file data
    $excelFile = 'data/emergency_data_2025.xlsx';
    if (file_exists($excelFile)) {
        // Use PHPSpreadsheet or similar to read Excel
        // Convert to JSON format
        $emergencyData = []; // Your parsed Excel data
        
        echo json_encode([
            'success' => true,
            'emergency_calls' => $emergencyData
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Emergency data file not found'
        ]);
    }
    break;
    
    case 'get-traffic-predictions':
    try {
        $node_id = $_GET['node_id'] ?? null;
        $hours = min(24, max(1, (int)($_GET['hours'] ?? 2)));
        
        // For now, generate predictions based on historical patterns
        // In a real system, this would use ML models
        
        $predictions = [];
        $currentTime = new Date();
        
        // Get historical data for the same time periods
        $historicalQuery = "
            SELECT 
                HOUR(created_at) as hour,
                DAYOFWEEK(created_at) as day_of_week,
                AVG(congestion_level) as avg_congestion,
                AVG(average_speed) as avg_speed,
                COUNT(*) as sample_size
            FROM traffic_alerts 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ";
        
        if ($node_id) {
            $historicalQuery .= " AND node_id = ?";
            $stmt = $db->prepare($historicalQuery . " GROUP BY hour, day_of_week");
            $stmt->execute([$node_id]);
        } else {
            $stmt = $db->prepare($historicalQuery . " GROUP BY hour, day_of_week");
            $stmt->execute();
        }
        
        $historicalData = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Generate predictions for next N hours
        for ($i = 1; $i <= $hours; $i++) {
            $futureTimestamp = time() + ($i * 3600); // Add hours
            $futureHour = (int)date('H', $futureTimestamp);
            $futureDayOfWeek = (int)date('w', $futureTimestamp) + 1; // MySQL DAYOFWEEK format
            
            // Find matching historical data
            $matchingData = array_filter($historicalData, function($row) use ($futureHour, $futureDayOfWeek) {
                return abs($row['hour'] - $futureHour) <= 1 && $row['day_of_week'] == $futureDayOfWeek;
            });
            
            if (!empty($matchingData)) {
                $prediction = array_reduce($matchingData, function($carry, $item) {
                    if (!$carry) return $item;
                    return [
                        'avg_congestion' => ($carry['avg_congestion'] + $item['avg_congestion']) / 2,
                        'avg_speed' => ($carry['avg_speed'] + $item['avg_speed']) / 2,
                        'sample_size' => $carry['sample_size'] + $item['sample_size']
                    ];
                });
            } else {
                // Fallback prediction based on time patterns
                $prediction = generateTimeBasedPrediction($futureHour, $futureDayOfWeek);
            }
            
            $predictions[] = [
                'timestamp' => date('Y-m-d H:i:s', $futureTimestamp),
                'hour' => $futureHour,
                'predicted_congestion' => round($prediction['avg_congestion'], 1),
                'predicted_speed' => round($prediction['avg_speed'], 1),
                'confidence' => min(100, ($prediction['sample_size'] ?? 1) * 10)
            ];
        }
        
        echo json_encode([
            'success' => true,
            'node_id' => $node_id,
            'predictions' => $predictions,
            'generated_at' => date('Y-m-d H:i:s')
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    break;

case 'ai-traffic-monitor':
        try {
            $nodes = $db->query("SELECT * FROM traffic_nodes WHERE is_active = 1")->fetchAll(PDO::FETCH_ASSOC);
            $alerts = [];
            $predictions = [];
            
            foreach ($nodes as $node) {
                // Simulate real-time data (replace with actual sensors)
                $congestion = rand(1, 5);
                $speed = 60 - ($congestion * 10);
                $vehicleCount = $congestion * rand(50, 100);
                
                // Store real-time data
                $stmt = $db->prepare("INSERT INTO traffic_realtime 
                    (node_id, congestion_level, average_speed, vehicle_count) 
                    VALUES (?, ?, ?, ?)");
                $stmt->execute([$node['node_id'], $congestion, $speed, $vehicleCount]);
                
                // Generate AI predictions
                $nodePredictions = $trafficAI->predictCongestion($node['node_id']);
                $predictions[$node['node_id']] = $nodePredictions;
                
                // Check for alerts
                if ($congestion >= 4) {
                    $alertId = 'ALERT_' . $node['node_id'] . '_' . time();
                    $optimizations = $trafficAI->generateOptimization($node['node_id'], $congestion);
                    
                    $alert = [
                        'id' => $alertId,
                        'type' => 'congestion',
                        'severity' => $congestion == 5 ? 'critical' : 'high',
                        'node' => $node,
                        'data' => [
                            'congestionLevel' => $congestion,
                            'averageSpeed' => $speed,
                            'vehicleCount' => $vehicleCount
                        ],
                        'message' => "High congestion detected at {$node['name']}",
                        'recommendations' => $optimizations,
                        'timestamp' => date('Y-m-d H:i:s')
                    ];
                    
                    $alerts[] = $alert;
                    
                    // Store alert
                    $stmt = $db->prepare("INSERT INTO traffic_alerts 
                        (alert_id, alert_type, severity, node_id, node_name, 
                         node_lat, node_lng, message, vehicle_count, 
                         average_speed, congestion_level, recommendations)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                    
                    $stmt->execute([
                        $alertId, 'congestion', $alert['severity'],
                        $node['node_id'], $node['name'],
                        $node['latitude'], $node['longitude'],
                        $alert['message'], $vehicleCount,
                        $speed, $congestion,
                        json_encode($optimizations)
                    ]);
                }
            }
            
            echo json_encode([
                'success' => true,
                'nodes' => $nodes,
                'alerts' => $alerts,
                'predictions' => $predictions,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;
        
    case 'traffic-heatmap':
        try {
            $stmt = $db->query("
                SELECT node_id, node_name, node_lat, node_lng, 
                       AVG(congestion_level) as avg_congestion
                FROM traffic_alerts
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                GROUP BY node_id, node_name, node_lat, node_lng
            ");
            
            $heatmapData = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'heatmap' => $heatmapData
            ]);
            
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;
        
    case 'crime-analytics':
        try {
            // AI-powered crime pattern analysis
            $stmt = $db->query("
                SELECT 
                    crime_type,
                    COUNT(*) as count,
                    AVG(CASE 
                        WHEN severity = 'critical' THEN 4
                        WHEN severity = 'high' THEN 3
                        WHEN severity = 'medium' THEN 2
                        ELSE 1
                    END) as avg_severity,
                    police_station
                FROM crime_data
                WHERE crime_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY crime_type, police_station
                ORDER BY count DESC
            ");
            
            $crimePatterns = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Hotspot analysis
            $stmt = $db->query("
                SELECT 
                    ROUND(latitude, 3) as lat,
                    ROUND(longitude, 3) as lng,
                    COUNT(*) as incident_count,
                    GROUP_CONCAT(crime_type) as crime_types
                FROM crime_data
                WHERE latitude IS NOT NULL 
                AND longitude IS NOT NULL
                AND crime_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY ROUND(latitude, 3), ROUND(longitude, 3)
                HAVING incident_count > 2
                ORDER BY incident_count DESC
            ");
            
            $hotspots = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'patterns' => $crimePatterns,
                'hotspots' => $hotspots,
                'analysis_date' => date('Y-m-d H:i:s')
            ]);
            
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;
        
    case 'crowd-prediction':
        try {
            // Predict crowd sizes for upcoming processions
            $stmt = $db->query("
                SELECT * FROM procession_routes 
                WHERE scheduled_date >= NOW() 
                AND scheduled_date <= DATE_ADD(NOW(), INTERVAL 7 DAY)
                AND status = 'approved'
            ");
            
            $upcomingRoutes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $predictions = [];
            
            foreach ($upcomingRoutes as $route) {
                // Base crowd estimate on festival type and historical data
                $baseCrowd = 1000;
                $multipliers = [
                    'गणेश उत्सव' => 5,
                    'नवरात्र उत्सव' => 4,
                    'दहीहंडी' => 3,
                    'होळी' => 3.5,
                    'दिवाळी' => 2
                ];
                
                $festivalMultiplier = $multipliers[$route['festival_name']] ?? 1.5;
                $estimatedCrowd = $baseCrowd * $festivalMultiplier;
                
                // Add weather factor (simplified)
                $weatherFactor = 1.0; // Could integrate weather API
                
                $predictions[] = [
                    'route_id' => $route['id'],
                    'festival' => $route['festival_name'],
                    'date' => $route['scheduled_date'],
                    'estimated_crowd' => round($estimatedCrowd * $weatherFactor),
                    'security_recommendation' => $estimatedCrowd > 3000 ? 'enhanced' : 'normal',
                    'traffic_impact' => $estimatedCrowd > 4000 ? 'severe' : 'moderate'
                ];
            }
            
            echo json_encode([
                'success' => true,
                'predictions' => $predictions
            ]);
            
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;
        
    case 'emergency-response':
        try {
            // Integrated emergency response system
            if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                
                $emergencyType = $input['type'];
                $location = $input['location'];
                $severity = $input['severity'] ?? 'medium';
                
                // Find nearest resources
                $stmt = $db->prepare("
                    SELECT *, 
                    (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * 
                     cos(radians(longitude) - radians(?)) + 
                     sin(radians(?)) * sin(radians(latitude)))) AS distance
                    FROM (
                        SELECT name, latitude, longitude, 'police' as type 
                        FROM police_stations
                        UNION
                        SELECT name, latitude, longitude, 'hospital' as type 
                        FROM hospitals
                    ) as resources
                    ORDER BY distance
                    LIMIT 5
                ");
                
                $stmt->execute([
                    $location['lat'], $location['lng'], $location['lat']
                ]);
                
                $nearestResources = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Generate response plan
                $responsePlan = [
                    'priority' => $severity,
                    'estimated_response_time' => $severity === 'critical' ? 5 : 10,
                    'resources_deployed' => $nearestResources,
                    'traffic_clearance' => $severity === 'critical',
                    'alert_radius' => $severity === 'critical' ? 2 : 1
                ];
                
                echo json_encode([
                    'success' => true,
                    'response_plan' => $responsePlan,
                    'incident_id' => 'INC_' . time()
                ]);
            }
            
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;
        
        case 'setup-directories':
    try {
        $directories = [
            'uploads',
            'uploads/images', 
            'uploads/crime',
            'uploads/historical',
            'uploads/layers',
            'geojson',
            'kml',
            'logs'
        ];
        
        $created = [];
        $errors = [];
        
        foreach ($directories as $dir) {
            if (!is_dir($dir)) {
                if (mkdir($dir, 0755, true)) {
                    $created[] = $dir;
                } else {
                    $errors[] = "Failed to create: $dir";
                }
            } else {
                $created[] = "$dir (already exists)";
            }
        }
        
        // Create empty boundary files if they don't exist
        $boundaryFiles = [
            'geojson/nashik-gramin-boundary.geojson' => [
                'type' => 'FeatureCollection',
                'features' => []
            ],
            'geojson/police-station-boundaries.geojson' => [
                'type' => 'FeatureCollection', 
                'features' => []
            ],
            'geojson/village-boundaries.geojson' => [
                'type' => 'FeatureCollection',
                'features' => []
            ]
        ];
        
        foreach ($boundaryFiles as $file => $content) {
            if (!file_exists($file)) {
                if (file_put_contents($file, json_encode($content, JSON_PRETTY_PRINT))) {
                    $created[] = $file;
                } else {
                    $errors[] = "Failed to create: $file";
                }
            }
        }
        
        // Create basic KML files
        $kmlContent = '<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Nashik Boundary</name>
    <description>Boundary data for Nashik</description>
  </Document>
</kml>';
        
        $kmlFiles = [
            'kml/nashik-gramin-boundary.kml',
            'kml/police-station-boundaries.kml'
        ];
        
        foreach ($kmlFiles as $file) {
            if (!file_exists($file)) {
                if (file_put_contents($file, $kmlContent)) {
                    $created[] = $file;
                } else {
                    $errors[] = "Failed to create: $file";
                }
            }
        }
        
        echo json_encode([
            'success' => true,
            'created' => $created,
            'errors' => $errors,
            'message' => 'Directory setup completed'
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
    break;
    
    
    case 'view-error-logs':
    try {
        $date = $_GET['date'] ?? date('Y-m-d');
        $logFile = 'logs/api_errors_' . $date . '.log';
        
        if (!file_exists($logFile)) {
            echo json_encode([
                'success' => true,
                'errors' => [],
                'message' => "No error log found for $date"
            ]);
            break;
        }
        
        $lines = file($logFile, FILE_IGNORE_NEW_LINES);
        $errors = [];
        
        foreach ($lines as $line) {
            $decoded = json_decode($line, true);
            if ($decoded) {
                $errors[] = $decoded;
            }
        }
        
        // Show only last 50 errors
        $errors = array_slice($errors, -50);
        
        echo json_encode([
            'success' => true,
            'errors' => $errors,
            'count' => count($errors),
            'date' => $date
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
    break;
    
    
    
        case 'simple-map-data':
    header('Content-Type: application/json');
    
    try {
        $response = [
            'success' => true,
            'data_points' => [],
            'crime_data' => [],
            'procession_routes' => [],
            'message' => 'Simple endpoint working'
        ];
        
        // Try to get data points safely
        try {
            $stmt = $db->query("SELECT COUNT(*) as count FROM data_points");
            if ($stmt) {
                $count = $stmt->fetch()['count'];
                $response['data_points_count'] = $count;
                
                if ($count > 0) {
                    $dataStmt = $db->query("
                        SELECT id, name, latitude, longitude, category_id, status, created_at 
                        FROM data_points 
                        WHERE latitude IS NOT NULL AND longitude IS NOT NULL 
                        LIMIT 10
                    ");
                    $response['data_points'] = $dataStmt->fetchAll(PDO::FETCH_ASSOC);
                }
            }
        } catch (Exception $e) {
            $response['data_points_error'] = $e->getMessage();
        }
        
        // Try to get crime data safely
        try {
            $stmt = $db->query("SELECT COUNT(*) as count FROM crime_data");
            if ($stmt) {
                $count = $stmt->fetch()['count'];
                $response['crime_data_count'] = $count;
                
                if ($count > 0) {
                    $crimeStmt = $db->query("
                        SELECT id, crime_type, latitude, longitude, status, created_at 
                        FROM crime_data 
                        WHERE latitude IS NOT NULL AND longitude IS NOT NULL 
                        LIMIT 10
                    ");
                    $response['crime_data'] = $crimeStmt->fetchAll(PDO::FETCH_ASSOC);
                }
            }
        } catch (Exception $e) {
            $response['crime_data_error'] = $e->getMessage();
        }
        
        // Try to get procession routes safely
        try {
            $stmt = $db->query("SELECT COUNT(*) as count FROM procession_routes");
            if ($stmt) {
                $count = $stmt->fetch()['count'];
                $response['procession_routes_count'] = $count;
                
                if ($count > 0) {
                    $routeStmt = $db->query("
                        SELECT id, festival_name, start_point_lat, start_point_lng, status, created_at 
                        FROM procession_routes 
                        WHERE start_point_lat IS NOT NULL AND start_point_lng IS NOT NULL 
                        LIMIT 10
                    ");
                    $response['procession_routes'] = $routeStmt->fetchAll(PDO::FETCH_ASSOC);
                }
            }
        } catch (Exception $e) {
            $response['procession_routes_error'] = $e->getMessage();
        }
        
        echo json_encode($response, JSON_PRETTY_PRINT);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage(),
            'line' => $e->getLine(),
            'file' => basename($e->getFile())
        ]);
    }
    break;
    
        case 'debug-map-issues':
    try {
        $debug = [];
        
        // Check PHP errors
        $debug['php_errors'] = error_get_last();
        
        // Check database connection
        try {
            $db->query("SELECT 1");
            $debug['database'] = 'Connected';
        } catch (Exception $e) {
            $debug['database'] = 'Error: ' . $e->getMessage();
        }
        
        // Check if tables exist
        $tables = ['data_points', 'crime_data', 'procession_routes', 'users', 'categories'];
        $debug['tables'] = [];
        
        foreach ($tables as $table) {
            try {
                $stmt = $db->query("SHOW TABLES LIKE '$table'");
                $exists = $stmt->fetch() !== false;
                
                if ($exists) {
                    $countStmt = $db->query("SELECT COUNT(*) as count FROM $table");
                    $count = $countStmt->fetch()['count'];
                    $debug['tables'][$table] = "Exists ($count records)";
                } else {
                    $debug['tables'][$table] = "Does not exist";
                }
            } catch (Exception $e) {
                $debug['tables'][$table] = "Error: " . $e->getMessage();
            }
        }
        
        // Check file permissions and paths
        $directories = ['uploads/', 'uploads/images/', 'uploads/crime/', 'geojson/', 'kml/'];
        $debug['directories'] = [];
        
        foreach ($directories as $dir) {
            $debug['directories'][$dir] = [
                'exists' => is_dir($dir),
                'readable' => is_readable($dir),
                'writable' => is_writable($dir)
            ];
        }
        
        // Check some boundary files
        $boundaryFiles = [
            'geojson/nashik-gramin-boundary.geojson',
            'kml/nashik-gramin-boundary.kml'
        ];
        
        $debug['boundary_files'] = [];
        foreach ($boundaryFiles as $file) {
            $debug['boundary_files'][$file] = [
                'exists' => file_exists($file),
                'readable' => file_exists($file) ? is_readable($file) : false,
                'size' => file_exists($file) ? filesize($file) : 0
            ];
        }
        
        echo json_encode([
            'success' => true,
            'debug_info' => $debug,
            'timestamp' => date('Y-m-d H:i:s')
        ], JSON_PRETTY_PRINT);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]);
    }
    break;
    
    case 'dashboard-analytics':
        try {
            // Comprehensive dashboard data
            $analytics = [];
            
            // Traffic overview
            $stmt = $db->query("
                SELECT 
                    AVG(congestion_level) as avg_congestion,
                    COUNT(CASE WHEN severity IN ('high', 'critical') THEN 1 END) as critical_alerts,
                    COUNT(*) as total_alerts
                FROM traffic_alerts
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ");
            $analytics['traffic'] = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Crime statistics
            $stmt = $db->query("
                SELECT 
                    COUNT(*) as total_crimes,
                    COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified,
                    COUNT(CASE WHEN severity IN ('high', 'critical') THEN 1 END) as serious_crimes
                FROM crime_data
                WHERE crime_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ");
            $analytics['crime'] = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Procession status
            $stmt = $db->query("
                SELECT 
                    COUNT(*) as total_routes,
                    COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
                    COUNT(CASE WHEN scheduled_date >= NOW() THEN 1 END) as upcoming
                FROM procession_routes
            ");
            $analytics['processions'] = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // User activity
            $stmt = $db->query("
                SELECT 
                    COUNT(DISTINCT user_id) as active_users,
                    COUNT(*) as total_submissions
                FROM (
                    SELECT user_id, created_at FROM data_points
                    UNION ALL
                    SELECT user_id, created_at FROM crime_data
                    UNION ALL
                    SELECT user_id, created_at FROM procession_routes
                ) as activity
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ");
            $analytics['users'] = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'analytics' => $analytics,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;
        
        case 'mobile-dashboard':
    try {
        $user_id = $_GET['user_id'] ?? 0;
        
        // Get user-specific dashboard data
        $stmt = $db->prepare("
            SELECT 
                (SELECT COUNT(*) FROM data_points WHERE user_id = ?) as my_data_points,
                (SELECT COUNT(*) FROM crime_data WHERE user_id = ?) as my_crime_reports,
                (SELECT COUNT(*) FROM procession_routes WHERE user_id = ?) as my_routes,
                (SELECT COUNT(*) FROM traffic_alerts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)) as active_alerts
        ");
        
        $stmt->execute([$user_id, $user_id, $user_id]);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get nearby incidents
        $lat = $_GET['lat'] ?? 19.9975;
        $lng = $_GET['lng'] ?? 73.7898;
        
        $stmt = $db->prepare("
            SELECT *, 
                (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * 
                 cos(radians(longitude) - radians(?)) + 
                 sin(radians(?)) * sin(radians(latitude)))) AS distance
            FROM crime_data
            WHERE status = 'verified'
            HAVING distance < 5
            ORDER BY distance
            LIMIT 10
        ");
        
        $stmt->execute([$lat, $lng, $lat]);
        $nearbyIncidents = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'stats' => $stats,
            'nearby_incidents' => $nearbyIncidents,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    break;

case 'mobile-quick-report':
    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        try {
            // Quick incident reporting
            $stmt = $db->prepare("
                INSERT INTO quick_reports 
                (user_id, incident_type, latitude, longitude, description, severity, image_url)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $input['user_id'],
                $input['incident_type'],
                $input['latitude'],
                $input['longitude'],
                $input['description'],
                $input['severity'],
                $input['image_url'] ?? null
            ]);
            
            $reportId = $db->lastInsertId();
            
            // Trigger AI analysis
            analyzeQuickReport($reportId, $input);
            
            echo json_encode([
                'success' => true,
                'report_id' => $reportId,
                'message' => 'Report submitted successfully'
            ]);
            
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }
    break;
    
case 'get-real-time-traffic':
    try {
        // Simulate real-time traffic data for demo
        $trafficNodes = [
            ['id' => 'node_1', 'name' => 'Gangapur Road Junction', 'lat' => 19.9975, 'lng' => 73.7898],
            ['id' => 'node_2', 'name' => 'Nashik Road Station', 'lat' => 20.0025, 'lng' => 73.7925],
            ['id' => 'node_3', 'name' => 'College Road', 'lat' => 19.9950, 'lng' => 73.7850],
            ['id' => 'node_4', 'name' => 'Satpur MIDC', 'lat' => 20.0050, 'lng' => 73.7950],
            ['id' => 'node_5', 'name' => 'Panchavati Area', 'lat' => 19.9900, 'lng' => 73.7800]
        ];
        
        $currentHour = (int)date('H');
        $realTimeData = [];
        
        foreach ($trafficNodes as $node) {
            $congestionLevel = generateCongestionLevel($currentHour, $node['id']);
            $speed = generateSpeed($congestionLevel);
            $vehicleCount = generateVehicleCount($currentHour, $congestionLevel);
            
            $realTimeData[] = [
                'node_id' => $node['id'],
                'node_name' => $node['name'],
                'latitude' => $node['lat'],
                'longitude' => $node['lng'],
                'congestion_level' => $congestionLevel,
                'average_speed' => $speed,
                'vehicle_count' => $vehicleCount,
                'timestamp' => date('Y-m-d H:i:s'),
                'status' => getCongestionStatus($congestionLevel)
            ];
        }
        
        echo json_encode([
            'success' => true,
            'traffic_data' => $realTimeData,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    break;

case 'traffic-optimization-suggestions':
    try {
        $node_id = $_GET['node_id'] ?? null;
        
        if (!$node_id) {
            echo json_encode(['success' => false, 'error' => 'Node ID required']);
            break;
        }
        
        // Get recent alert data for the node
        $stmt = $db->prepare("
            SELECT * FROM traffic_alerts 
            WHERE node_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 2 HOUR)
            ORDER BY created_at DESC
            LIMIT 10
        ");
        $stmt->execute([$node_id]);
        $recentAlerts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // AI-generated optimization suggestions
        $suggestions = generateOptimizationSuggestions($node_id, $recentAlerts);
        
        echo json_encode([
            'success' => true,
            'node_id' => $node_id,
            'suggestions' => $suggestions,
            'recent_alerts_count' => count($recentAlerts)
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    break;

    
    case 'get-categories-with-subcategories':
    try {
        // First, get counts of data points by category and subcategory
        $countStmt = $db->query("
            SELECT 
                category_id,
                subcategory_id,
                COUNT(*) as count
            FROM data_points
            GROUP BY category_id, subcategory_id
        ");
        
        $dataCounts = [];
        while($row = $countStmt->fetch(PDO::FETCH_ASSOC)) {
            $key = $row['category_id'] . '_' . ($row['subcategory_id'] ?: '0');
            $dataCounts[$key] = $row['count'];
        }
        
        // Get categories with their subcategories
        $stmt = $db->query("
            SELECT 
                c.id as category_id,
                c.name as category_name,
                c.color as category_color,
                c.icon as category_icon,
                s.id as subcategory_id,
                s.name as subcategory_name,
                s.icon as subcategory_icon
            FROM categories c
            LEFT JOIN subcategories s ON c.id = s.category_id
            WHERE c.is_active = 1
            ORDER BY c.name, s.name
        ");
        
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Organize data hierarchically
        $categories = [];
        foreach($results as $row) {
            $catId = $row['category_id'];
            if (!isset($categories[$catId])) {
                // Only add category if it has data
                $catCount = 0;
                foreach($dataCounts as $key => $count) {
                    if (strpos($key, $catId . '_') === 0) {
                        $catCount += $count;
                    }
                }
                
                if ($catCount > 0) {
                    $categories[$catId] = [
                        'id' => $catId,
                        'name' => $row['category_name'],
                        'color' => $row['category_color'] ?: '#2196F3',
                        'icon' => $row['category_icon'] ?: '📍',
                        'subcategories' => [],
                        'count' => $catCount
                    ];
                }
            }
            
            // Only add subcategory if it has data
            if ($row['subcategory_id'] && isset($categories[$catId])) {
                $subKey = $catId . '_' . $row['subcategory_id'];
                if (isset($dataCounts[$subKey]) && $dataCounts[$subKey] > 0) {
                    $categories[$catId]['subcategories'][] = [
                        'id' => $row['subcategory_id'],
                        'name' => $row['subcategory_name'],
                        'icon' => $row['subcategory_icon'],
                        'count' => $dataCounts[$subKey]
                    ];
                }
            }
        }
        
        echo json_encode([
            'success' => true,
            'categories' => array_values($categories),
            'counts' => $dataCounts
        ], JSON_UNESCAPED_UNICODE);
        
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    break;
    
    case 'reset-password':
    $phone = $_GET['phone'] ?? '';
    $new_password = $_GET['new_password'] ?? 'test123';
    
    if (empty($phone)) {
        echo json_encode(['success' => false, 'message' => 'Phone required']);
        break;
    }
    
    try {
        $hashed = password_hash($new_password, PASSWORD_DEFAULT);
        $stmt = $db->prepare("UPDATE users SET password = ? WHERE phone = ?");
        $result = $stmt->execute([$hashed, $phone]);
        
        if ($result && $stmt->rowCount() > 0) {
            echo json_encode([
                'success' => true,
                'message' => 'Password reset successful',
                'new_password' => $new_password
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'User not found']);
        }
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    break;
    
    case 'get-gis-bounds':
    try {
        $stmt = $db->query("
            SELECT 
                MIN(latitude) as min_lat,
                MAX(latitude) as max_lat,
                MIN(longitude) as min_lng,
                MAX(longitude) as max_lng,
                COUNT(*) as total_features
            FROM gis_features 
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        ");
        
        $bounds = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'bounds' => $bounds
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
    break;
    
    case 'force-login':
    $phone = $_GET['phone'] ?? '';
    
    try {
        $stmt = $db->prepare("SELECT id, name, email, phone, role, police_station FROM users WHERE phone = ?");
        $stmt->execute([$phone]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            // Force login without password check (REMOVE THIS IN PRODUCTION!)
            echo json_encode([
                'success' => true,
                'message' => 'Force login successful (TEST MODE)',
                'user' => $user,
                'user_id' => (int)$user['id']
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'User not found']);
        }
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    break;
    
    
    case 'get-festivals':
    try {
        
        $stmt = $db->query("SHOW TABLES LIKE 'festivals'");
        if ($stmt->rowCount() > 0) {
            // Fetch from database
            $stmt = $db->query("SELECT id, name FROM festivals WHERE is_active = 1 ORDER BY name");
            $festivals = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } else {
            
            $festivals = [
                ['id' => 1, 'name' => 'गणेश उत्सव'],
                ['id' => 2, 'name' => 'नवरात्र उत्सव'],
                ['id' => 3, 'name' => 'दहीहंडी'],
                ['id' => 4, 'name' => 'होळी'],
                ['id' => 5, 'name' => 'दिवाळी'],
                ['id' => 6, 'name' => 'दुर्गा पूजा'],
                ['id' => 7, 'name' => 'महाशिवरात्री'],
                ['id' => 8, 'name' => 'रामनवमी'],
                ['id' => 9, 'name' => 'जन्माष्टमी'],
                ['id' => 10, 'name' => 'पंढरपूर वारी (आषाढी, कार्तिकी)'],
                ['id' => 11, 'name' => 'आळंदी वारी (संत ज्ञानेश्वर पालखी)'],
                ['id' => 12, 'name' => 'देहू वारी (संत तुकाराम पालखी)'],
                ['id' => 13, 'name' => 'महालक्ष्मी यात्रा (कोल्हापूर)'],
                ['id' => 14, 'name' => 'नागपंचमी'],
                ['id' => 15, 'name' => 'भंडारा उत्सव'],
                ['id' => 16, 'name' => 'चंड्रभागा यात्रा'],
                ['id' => 17, 'name' => 'ग्रामदैवत यात्रा'],
                ['id' => 18, 'name' => 'मोहर्म'],
                ['id' => 19, 'name' => 'ईद-ए-मिलाद'],
                ['id' => 20, 'name' => 'उर्स यात्रा'],
                ['id' => 21, 'name' => 'रामजान ईद'],
                ['id' => 22, 'name' => 'क्रिसमस'],
                ['id' => 23, 'name' => 'गुड फ्रायडे'],
                ['id' => 24, 'name' => 'ईस्टर संडे'],
                ['id' => 25, 'name' => 'बुद्ध पौर्णिमा'],
                ['id' => 26, 'name' => 'धम्मचक्र प्रवर्तन दिन'],
                ['id' => 27, 'name' => 'गुरुनानक जयंती'],
                ['id' => 28, 'name' => 'वैशाखी'],
                ['id' => 29, 'name' => 'महावीर जयंती'],
                ['id' => 30, 'name' => 'पार्युषण पर्व समाप्ती शोभायात्रा'],
                ['id' => 999, 'name' => 'इतर'] 
            ];
        }
        
        echo json_encode([
            'success' => true,
            'festivals' => $festivals
        ]);
    } catch(Exception $e) {
        echo json_encode([
            'success' => false, 
            'message' => 'Error loading festivals: ' . $e->getMessage()
        ]);
    }
    break;
    
// Add this case to your switch statement
case 'get-gis-features':
    try {
        
        $cacheKey = "gis_features:" . md5(serialize($_GET));
        $cached = $cache->get($cacheKey);
        
        if ($cached) {
            echo $cached;
            break;
        }
        
        $category = $_GET['category'] ?? null;
        $feature_type = $_GET['feature_type'] ?? null;
        $bounds = $_GET['bounds'] ?? null;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 1000;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
        
        // Build base query - get geometry field to extract coordinates
        $sql = "SELECT id, feature_type, category, subcategory, name, description, 
                       latitude, longitude, geometry, properties, source_file, created_at 
                FROM gis_features WHERE 1=1";
        $params = [];
        
        // Add filters
        if ($category) {
            $sql .= " AND category = ?";
            $params[] = $category;
        }
        
        if ($feature_type) {
            $sql .= " AND feature_type = ?";
            $params[] = $feature_type;
        }
        
        // Add ordering and limit
        $sql .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $features = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Process features and extract coordinates from geometry
        $validFeatures = [];
        foreach ($features as $feature) {
            $extractedCoords = extractCoordinatesFromGeometry($feature);
            
            if ($extractedCoords) {
                $feature['latitude'] = $extractedCoords['lat'];
                $feature['longitude'] = $extractedCoords['lng'];
                $feature['extracted_coordinates'] = true;
                
                // Decode other JSON fields
                if ($feature['geometry']) {
                    $decoded = json_decode($feature['geometry'], true);
                    $feature['geometry'] = $decoded ?: $feature['geometry'];
                }
                
                if ($feature['properties']) {
                    $decoded = json_decode($feature['properties'], true);
                    $feature['properties'] = $decoded ?: $feature['properties'];
                }
                
                // Ensure numeric values
                $feature['latitude'] = (float)$feature['latitude'];
                $feature['longitude'] = (float)$feature['longitude'];
                $feature['id'] = (int)$feature['id'];
                
                $validFeatures[] = $feature;
            }
        }
        
        // Apply bounding box filter after coordinate extraction if provided
        $bounds = $_GET['bounds'] ?? null;
        if ($bounds) {
            $boundsData = json_decode($bounds, true);
            $sql .= " AND latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?";
            $params[] = $boundsData['south'];
            $params[] = $boundsData['north'];
            $params[] = $boundsData['west'];
            $params[] = $boundsData['east'];
        }
        
        
        $result = APIResponse::success($features);
        $cache->set($cacheKey, $result, 300); // 5 minutes
        
        
        echo $result;
    } catch (Exception $e) {
        echo APIResponse::error($e->getMessage());
    }
    break;
   
case 'get-gis-features-fixed':
    try {
        // Get parameters
        $category = $_GET['category'] ?? null;
        $feature_type = $_GET['feature_type'] ?? null;
        $limit = min((int)($_GET['limit'] ?? 1000), 5000); // Cap at 5000
        $offset = max(0, (int)($_GET['offset'] ?? 0));
        
        // Build optimized query
        $sql = "SELECT 
                    id, feature_type, category, subcategory, name, description, 
                    COALESCE(latitude, 0) as latitude, 
                    COALESCE(longitude, 0) as longitude,
                    geometry, properties, source_file
                FROM gis_features 
                WHERE 1=1";
        
        $params = [];
        
        // Add filters
        if ($category) {
            $sql .= " AND category = ?";
            $params[] = $category;
        }
        
        if ($feature_type) {
            $sql .= " AND feature_type = ?";
            $params[] = $feature_type;
        }
        
        // Only get records that might have coordinates
        $sql .= " AND (latitude IS NOT NULL OR geometry IS NOT NULL)";
        
        // Add ordering and pagination
        $sql .= " ORDER BY id LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $rawFeatures = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $validFeatures = [];
        $extractedCount = 0;
        
        foreach ($rawFeatures as $feature) {
            $coords = extractAndValidateCoordinates($feature);
            
            if ($coords) {
                $feature['latitude'] = $coords['lat'];
                $feature['longitude'] = $coords['lng'];
                $feature['coordinate_source'] = $coords['source'];
                
                // Ensure numeric types
                $feature['id'] = (int)$feature['id'];
                $feature['latitude'] = (float)$feature['latitude'];
                $feature['longitude'] = (float)$feature['longitude'];
                
                // Parse JSON fields safely
                if ($feature['properties']) {
                    $decoded = json_decode($feature['properties'], true);
                    $feature['properties'] = $decoded ?: [];
                }
                
                if ($feature['geometry']) {
                    $decoded = json_decode($feature['geometry'], true);
                    $feature['geometry'] = $decoded ?: $feature['geometry'];
                }
                
                $validFeatures[] = $feature;
                $extractedCount++;
            }
        }
        
        // If no valid features found, create sample data for testing
        if (empty($validFeatures) && $offset === 0) {
            $validFeatures = createSampleGISFeatures();
        }
        
        echo json_encode([
            'success' => true,
            'features' => $validFeatures,
            'count' => count($validFeatures),
            'extracted_coordinates' => $extractedCount,
            'total_processed' => count($rawFeatures),
            'offset' => $offset,
            'limit' => $limit,
            'has_sample_data' => empty($rawFeatures)
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage(),
            'fallback_features' => createSampleGISFeatures()
        ]);
    }
    break;
    
case 'get-gis-categories':
    try {
        // Get unique categories and their counts
        $stmt = $db->query("
            SELECT 
                category,
                feature_type,
                COUNT(*) as count,
                MIN(name) as sample_name
            FROM gis_features 
            WHERE category IS NOT NULL AND category != ''
            GROUP BY category, feature_type
            ORDER BY category, feature_type
        ");
        
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Group by category
        $categories = [];
        foreach ($results as $row) {
            $cat = $row['category'];
            if (!isset($categories[$cat])) {
                $categories[$cat] = [
                    'name' => $cat,
                    'feature_types' => [],
                    'total_count' => 0
                ];
            }
            
            $categories[$cat]['feature_types'][] = [
                'type' => $row['feature_type'],
                'count' => (int)$row['count'],
                'sample_name' => $row['sample_name']
            ];
            
            $categories[$cat]['total_count'] += (int)$row['count'];
        }
        
        echo json_encode([
            'success' => true,
            'categories' => array_values($categories)
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
    break;
    

case 'get-emergency-calls':
    $sql = "SELECT * FROM emergency_calls ORDER BY call_received_time DESC LIMIT 5000";
    $result = $conn->query($sql);
    
    $calls = [];
    while ($row = $result->fetch_assoc()) {
        $calls[] = $row;
    }
    
    echo json_encode([
        'success' => true,
        'calls' => $calls,
        'count' => count($calls)
    ]);
    break;

case 'dashboard-stats':
    try {
        $stats = [];
        
        // Data Points Statistics
        $stmt = $db->query("SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified,
            SUM(CASE WHEN status = 'pending' OR status IS NULL THEN 1 ELSE 0 END) as pending
            FROM data_points");
        $stats['dataPoints'] = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Crime Data Statistics
        $stmt = $db->query("SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified,
            SUM(CASE WHEN status = 'pending' OR status IS NULL THEN 1 ELSE 0 END) as pending
            FROM crime_data");
        $stats['crimes'] = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Procession Routes Statistics
        $stmt = $db->query("SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN status = 'pending' OR status IS NULL THEN 1 ELSE 0 END) as pending
            FROM procession_routes");
        $stats['routes'] = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true] + $stats);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    break;

case 'user-statistics':
    try {
        $stmt = $db->query("
            SELECT 
                u.id,
                u.name,
                u.phone,
                u.email,
                u.police_station,
                (SELECT COUNT(*) FROM data_points WHERE user_id = u.id) as data_points,
                (SELECT COUNT(*) FROM crime_data WHERE user_id = u.id) as crime_records,
                (SELECT COUNT(*) FROM procession_routes WHERE user_id = u.id) as routes,
                (SELECT COUNT(*) FROM data_points WHERE user_id = u.id) + 
                (SELECT COUNT(*) FROM crime_data WHERE user_id = u.id) + 
                (SELECT COUNT(*) FROM procession_routes WHERE user_id = u.id) as total_entries,
                GREATEST(
                    COALESCE((SELECT MAX(created_at) FROM data_points WHERE user_id = u.id), '2000-01-01'),
                    COALESCE((SELECT MAX(created_at) FROM crime_data WHERE user_id = u.id), '2000-01-01'),
                    COALESCE((SELECT MAX(created_at) FROM procession_routes WHERE user_id = u.id), '2000-01-01')
                ) as last_activity
            FROM users u
            WHERE u.role = 'data_collector'
            ORDER BY total_entries DESC, u.name
        ");
        
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Clean up dates
        foreach ($users as &$user) {
            if ($user['last_activity'] == '2000-01-01 00:00:00') {
                $user['last_activity'] = null;
            }
        }
        
        echo json_encode(['success' => true, 'users' => $users]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    break;

case 'station-statistics':
    try {
        $stmt = $db->query("
            SELECT 
                ps.station_name,
                ps.station_name_marathi,
                COUNT(DISTINCT u.id) as total_users,
                SUM(CASE WHEN 
                    (SELECT COUNT(*) FROM data_points WHERE user_id = u.id) + 
                    (SELECT COUNT(*) FROM crime_data WHERE user_id = u.id) + 
                    (SELECT COUNT(*) FROM procession_routes WHERE user_id = u.id) > 0 
                    THEN 1 ELSE 0 END) as active_users,
                (SELECT COUNT(*) FROM data_points dp 
                    JOIN users u2 ON dp.user_id = u2.id 
                    WHERE u2.police_station = ps.station_name) as data_points,
                (SELECT COUNT(*) FROM crime_data cd 
                    WHERE cd.police_station = ps.station_name) as crime_records,
                (SELECT COUNT(*) FROM procession_routes pr 
                    WHERE pr.police_station = ps.station_name) as routes,
                (SELECT COUNT(*) FROM data_points dp 
                    JOIN users u2 ON dp.user_id = u2.id 
                    WHERE u2.police_station = ps.station_name AND (dp.status = 'pending' OR dp.status IS NULL)) +
                (SELECT COUNT(*) FROM crime_data cd 
                    WHERE cd.police_station = ps.station_name AND (cd.status = 'pending' OR cd.status IS NULL)) +
                (SELECT COUNT(*) FROM procession_routes pr 
                    WHERE pr.police_station = ps.station_name AND (pr.status = 'pending' OR pr.status IS NULL)) as pending_approvals
            FROM police_stations ps
            LEFT JOIN users u ON u.police_station = ps.station_name
            WHERE ps.is_active = 1
            GROUP BY ps.id, ps.station_name, ps.station_name_marathi
            ORDER BY ps.station_name
        ");
        
        $stations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate total entries for each station
        foreach ($stations as &$station) {
            $station['total_entries'] = 
                ($station['data_points'] ?? 0) + 
                ($station['crime_records'] ?? 0) + 
                ($station['routes'] ?? 0);
        }
        
        echo json_encode(['success' => true, 'stations' => $stations]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    break;
    
    case 'test-crime-save':
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'method' => $_SERVER['REQUEST_METHOD'],
        'post_data' => $_POST,
        'files' => isset($_FILES) ? array_keys($_FILES) : [],
        'endpoint' => $endpoint
    ]);
     break;
     
     case 'add-village':
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $station_id = $_POST['station_id'] ?? null;
        $village_name = trim($_POST['village_name'] ?? '');
        $village_name_marathi = trim($_POST['village_name_marathi'] ?? '');
        
        if (!$station_id || !$village_name_marathi) {
            echo json_encode(['success' => false, 'message' => 'Required fields missing']);
            break;
        }
        
        try {
            // Check if village already exists
            $checkStmt = $db->prepare("SELECT id FROM villages WHERE village_name_marathi = ? AND police_station_id = ?");
            $checkStmt->execute([$village_name_marathi, $station_id]);
            
            if ($checkStmt->fetch()) {
                echo json_encode(['success' => false, 'message' => 'Village already exists']);
                break;
            }
            
            // Add new village
            $stmt = $db->prepare("INSERT INTO villages (police_station_id, village_name, village_name_marathi, is_active, created_at) VALUES (?, ?, ?, 1, NOW())");
            $stmt->execute([$station_id, $village_name, $village_name_marathi]);
            
            echo json_encode([
                'success' => true,
                'village_id' => $db->lastInsertId(),
                'message' => 'Village added successfully'
            ]);
        } catch(Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error adding village']);
        }
    }
    break;
    
    case 'add-festival':
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $festival_name = trim($_POST['festival_name'] ?? '');
        $festival_name_english = trim($_POST['festival_name_english'] ?? '');
        $category = $_POST['category'] ?? 'धार्मिक';
        
        if (empty($festival_name)) {
            echo json_encode(['success' => false, 'message' => 'Festival name required']);
            break;
        }
        
        try {
            // Ensure festivals table exists
            $db->exec("CREATE TABLE IF NOT EXISTS festivals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                name_english VARCHAR(255),
                category VARCHAR(255) DEFAULT 'धार्मिक',
                is_active TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )");
            
            // Check if festival already exists
            $checkStmt = $db->prepare("SELECT id FROM festivals WHERE name = ?");
            $checkStmt->execute([$festival_name]);
            
            if ($checkStmt->fetch()) {
                echo json_encode(['success' => false, 'message' => 'Festival already exists']);
                break;
            }
            
            // Add new festival
            $stmt = $db->prepare("INSERT INTO festivals (name, name_english, category, is_active, created_at) VALUES (?, ?, ?, 1, NOW())");
            $stmt->execute([$festival_name, $festival_name_english, $category]);
            
            echo json_encode([
                'success' => true,
                'festival_id' => $db->lastInsertId(),
                'message' => 'Festival added successfully'
            ]);
        } catch(Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error adding festival']);
        }
    }
    break;
    
    case 'login':
    $phone = $_GET['phone'] ?? $_POST['phone'] ?? '';
    $password = $_GET['password'] ?? $_POST['password'] ?? '';
    
    // Log the raw input for debugging
    error_log("Login attempt - Raw phone: " . $phone);
    error_log("Login attempt - Raw password length: " . strlen($password));
    
    // Clean phone number - remove country code and any formatting
    $phone = str_replace('+91', '', $phone);
    $phone = str_replace(' ', '', $phone);
    $phone = str_replace('-', '', $phone);
    $phone = trim($phone);
    
    error_log("Login attempt - Cleaned phone: " . $phone);
    
    if (empty($phone) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Phone and password required']);
        exit;
    }

    try {
        // Try to find user with cleaned phone number
        $stmt = $db->prepare("SELECT id, name, email, phone, password, role, police_station 
                              FROM users 
                              WHERE phone = ?");
        $stmt->execute([$phone]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        error_log("User found: " . ($user ? "Yes - ID: " . $user['id'] : "No"));
        
        if ($user) {
            // Check if password exists and verify it
            if (!empty($user['password'])) {
                $passwordVerified = password_verify($password, $user['password']);
                error_log("Password verification: " . ($passwordVerified ? "SUCCESS" : "FAILED"));
                
                if ($passwordVerified) {
                    unset($user['password']); // Remove password from response
                    
                    $response = [
                        'success' => true,
                        'message' => 'Login successful',
                        'user' => $user,
                        'user_id' => (int)$user['id']
                    ];
                    
                    error_log("Login successful for user ID: " . $user['id']);
                    echo json_encode($response);
                } else {
                    error_log("Password verification failed for user: " . $user['id']);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Invalid password'
                    ]);
                }
            } else {
                // Handle case where password is empty - you might want to force password reset
                error_log("Empty password for user: " . $user['id']);
                echo json_encode([
                    'success' => false,
                    'message' => 'Account requires password setup. Contact administrator.'
                ]);
            }
        } else {
            error_log("No user found with phone: " . $phone);
            
            // Check what phone numbers exist in database for debugging
            $debugStmt = $db->query("SELECT phone FROM users LIMIT 5");
            $existingPhones = $debugStmt->fetchAll(PDO::FETCH_COLUMN);
            error_log("Existing phones in DB: " . implode(', ', $existingPhones));
            
            echo json_encode([
                'success' => false,
                'message' => 'Invalid phone number or password'
            ]);
        }
    } catch(Exception $e) {
        error_log("Login exception: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'Login failed: ' . $e->getMessage()
        ]);
    }
    
    break;
    
    case 'debug-login':
    $phone = $_GET['phone'] ?? '';
    $password = $_GET['password'] ?? '';
    
    if (empty($phone)) {
        echo json_encode(['error' => 'Phone required']);
        break;
    }
    
    try {
        $stmt = $db->prepare("SELECT id, name, phone, password FROM users WHERE phone = ?");
        $stmt->execute([$phone]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            $response = [
                'user_found' => true,
                'user_id' => $user['id'],
                'name' => $user['name'],
                'phone_in_db' => $user['phone'],
                'has_password' => !empty($user['password']),
                'password_length' => strlen($user['password'] ?? ''),
                'password_starts_with' => substr($user['password'] ?? '', 0, 10) . '...'
            ];
            
            if (!empty($password) && !empty($user['password'])) {
                $response['password_verified'] = password_verify($password, $user['password']);
            }
            
            echo json_encode($response);
        } else {
            // Show all phones in database for comparison
            $stmt = $db->query("SELECT phone FROM users");
            $allPhones = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            echo json_encode([
                'user_found' => false,
                'searched_phone' => $phone,
                'existing_phones' => $allPhones
            ]);
        }
    } catch(Exception $e) {
        echo json_encode(['error' => $e->getMessage()]);
    }
    break;
    
    case 'app-login-test':
    // Log everything the app sends
    $debug = [
        'timestamp' => date('Y-m-d H:i:s'),
        'method' => $_SERVER['REQUEST_METHOD'],
        'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'not set',
        'get_data' => $_GET,
        'post_data' => $_POST,
        'raw_body' => file_get_contents('php://input'),
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'not set'
    ];
    
    // Save to a log file
    file_put_contents('app_login_debug.txt', json_encode($debug, JSON_PRETTY_PRINT) . "\n\n", FILE_APPEND);
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'user' => [
            'id' => 4,
            'name' => 'Test User',
            'phone' => '8983839143'
        ],
        'user_id' => 4
    ]);
    break;
    
     case 'get-boundary-file':
    $fileType = $_GET['type'] ?? 'geojson';
    $fileName = $_GET['file'] ?? 'nashik-gramin-boundary';
    
    $allowedFiles = [
        'geojson' => [
            'nashik-gramin-boundary' => 'geojson/nashik-gramin-boundary.geojson',
            'police-station-boundaries' => 'geojson/police-station-boundaries.geojson',
            'village-boundaries' => 'geojson/village-boundaries.geojson'
        ],
        'kml' => [
            'nashik-gramin-boundary' => 'kml/nashik-gramin-boundary.kml',
            'police-station-boundaries' => 'kml/police-station-boundaries.kml'
        ]
    ];
    
    if (!isset($allowedFiles[$fileType][$fileName])) {
        http_response_code(404);
        echo json_encode(['error' => 'File not found']);
        exit;
    }
    
    $filePath = __DIR__ . '/' . $allowedFiles[$fileType][$fileName];
    
    // Check if file exists, if not return empty GeoJSON
    if (!file_exists($filePath)) {
        if ($fileType === 'geojson') {
            // Return empty but valid GeoJSON
            header('Content-Type: application/geo+json');
            echo json_encode([
                'type' => 'FeatureCollection',
                'features' => []
            ]);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'File does not exist']);
        }
        exit;
    }
    
    // Set appropriate headers
    if ($fileType === 'geojson') {
        header('Content-Type: application/geo+json');
    } else {
        header('Content-Type: application/vnd.google-earth.kml+xml');
    }
    
    header('Content-Disposition: inline; filename="' . basename($filePath) . '"');
    header('Access-Control-Allow-Origin: *');
    readfile($filePath);
    break;
    
     
     case 'get-kml':
    $kmlType = $_GET['type'] ?? 'nashik-gramin';
    
    $kmlFiles = [
        'nashik-gramin' => 'kml/nashik-gramin-boundary.kml'
    ];
    
    if (!isset($kmlFiles[$kmlType])) {
        http_response_code(404);
        echo json_encode(['error' => 'KML file not found']);
        exit;
    }
    
    $kmlPath = __DIR__ . '/' . $kmlFiles[$kmlType];
    
    if (!file_exists($kmlPath)) {
        http_response_code(404);
        echo json_encode(['error' => 'KML file does not exist']);
        exit;
    }
    
    header('Content-Type: application/vnd.google-earth.kml+xml');
    header('Content-Disposition: inline; filename="' . basename($kmlPath) . '"');
    readfile($kmlPath);
    break;
     
case 'get-map-data':
    try {
        $response = [
            'success' => true,
            'data_points' => [],
            'crime_data' => [],
            'procession_routes' => []
        ];
        
        // Get data points
        $stmt = $db->query("
            SELECT dp.*, u.name as user_name, c.name as category_name, c.color as category_color
            FROM data_points dp 
            LEFT JOIN users u ON dp.user_id = u.id 
            LEFT JOIN categories c ON dp.category_id = c.id 
            WHERE dp.latitude IS NOT NULL AND dp.longitude IS NOT NULL
            ORDER BY dp.created_at DESC
        ");
        $response['data_points'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get crime data
        $stmt = $db->query("
            SELECT * FROM crime_data 
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL 
            ORDER BY created_at DESC
        ");
        $response['crime_data'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get procession routes
        $stmt = $db->query("
            SELECT * FROM procession_routes 
            WHERE start_point_lat IS NOT NULL AND start_point_lng IS NOT NULL 
            ORDER BY created_at DESC
        ");
        $response['procession_routes'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($response);
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    break;
    
 case 'debug-gis-data':
    try {
        // Get first 5 records to examine the data structure
        $stmt = $db->query("
            SELECT id, feature_type, category, name, latitude, longitude, 
                   LEFT(geometry, 500) as geometry_sample,
                   CHAR_LENGTH(geometry) as geometry_length
            FROM gis_features 
            WHERE geometry IS NOT NULL 
            LIMIT 5
        ");
        
        $samples = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $debug_info = [];
        foreach ($samples as $sample) {
            $debug_info[] = [
                'id' => $sample['id'],
                'category' => $sample['category'],
                'feature_type' => $sample['feature_type'],
                'name' => $sample['name'],
                'db_latitude' => $sample['latitude'],
                'db_longitude' => $sample['longitude'],
                'geometry_length' => $sample['geometry_length'],
                'geometry_sample' => $sample['geometry_sample'],
                'geometry_type' => gettype($sample['geometry_sample'])
            ];
        }
        
        // Also get some statistics
        $stats = $db->query("
            SELECT 
                COUNT(*) as total_features,
                COUNT(CASE WHEN latitude != 0 AND longitude != 0 THEN 1 END) as non_zero_coords,
                COUNT(CASE WHEN geometry IS NOT NULL AND geometry != '' THEN 1 END) as has_geometry,
                COUNT(CASE WHEN latitude IS NULL OR longitude IS NULL THEN 1 END) as null_coords
            FROM gis_features
        ")->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'samples' => $debug_info,
            'statistics' => $stats,
            'debug_timestamp' => date('Y-m-d H:i:s')
        ], JSON_PRETTY_PRINT);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
    break;
case 'test-gis-markers':
    try {
        // Create test markers with known Nashik coordinates
        $testMarkers = [
            [
                'id' => 'test1',
                'feature_type' => 'point',
                'category' => 'water',
                'name' => 'Test Water Point 1',
                'latitude' => 19.9975,
                'longitude' => 73.7898,
                'geometry' => null,
                'properties' => ['test' => true],
                'source_file' => 'test_data'
            ],
            [
                'id' => 'test2', 
                'feature_type' => 'point',
                'category' => 'building',
                'name' => 'Test Building 1',
                'latitude' => 20.0025,
                'longitude' => 73.7925,
                'geometry' => null,
                'properties' => ['test' => true],
                'source_file' => 'test_data'
            ],
            [
                'id' => 'test3',
                'feature_type' => 'point', 
                'category' => 'surface',
                'name' => 'Test Surface 1',
                'latitude' => 19.9950,
                'longitude' => 73.7850,
                'geometry' => null,
                'properties' => ['test' => true],
                'source_file' => 'test_data'
            ],
            [
                'id' => 'test4',
                'feature_type' => 'point',
                'category' => 'vegetation', 
                'name' => 'Test Vegetation 1',
                'latitude' => 20.0050,
                'longitude' => 73.7950,
                'geometry' => null,
                'properties' => ['test' => true],
                'source_file' => 'test_data'
            ],
            [
                'id' => 'test5',
                'feature_type' => 'point',
                'category' => 'railway',
                'name' => 'Test Railway 1', 
                'latitude' => 19.9900,
                'longitude' => 73.7800,
                'geometry' => null,
                'properties' => ['test' => true],
                'source_file' => 'test_data'
            ]
        ];
        
        echo json_encode([
            'success' => true,
            'features' => $testMarkers,
            'count' => count($testMarkers),
            'message' => 'Test markers with valid Nashik coordinates'
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
    break;
    
case 'update-police-station':
    $user_id = $_POST['user_id'] ?? 0;
    $police_station = $_POST['police_station'] ?? '';
    
    try {
        $stmt = $db->prepare("UPDATE users SET police_station = ? WHERE id = ?");
        $result = $stmt->execute([$police_station, $user_id]);
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Police station updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update police station']);
        }
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error updating police station']);
    }
    break;
    
    case 'create-user':
        $name = $_GET['name'] ?? '';
        $phone = $_GET['phone'] ?? '';
        $email = $_GET['email'] ?? '';
        
        if (empty($name)) {
            echo json_encode(['success' => false, 'message' => 'Name required']);
            exit;
        }
        
        try {
            // Check if user exists
            $stmt = $db->prepare("SELECT id FROM users WHERE name = ? AND (phone = ? OR email = ?)");
            $stmt->execute([$name, $phone, $email]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($existing) {
                echo json_encode(['success' => true, 'user_id' => (int)$existing['id']]);
            } else {
                // Create new user
                $stmt = $db->prepare("INSERT INTO users (name, phone, email, role) VALUES (?, ?, ?, 'data_collector')");
                $stmt->execute([$name, $phone, $email]);
                echo json_encode(['success' => true, 'user_id' => (int)$db->lastInsertId()]);
            }
        } catch(Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Database error']);
        }
        break;
        
    case 'categories':
        try {
            $stmt = $db->query("SELECT * FROM categories WHERE is_active = 1");
            $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Convert IDs to integers
            foreach($categories as &$cat) {
                $cat['id'] = (int)$cat['id'];
                
                // Get subcategories
                $sub_stmt = $db->prepare("SELECT * FROM subcategories WHERE category_id = ?");
                $sub_stmt->execute([$cat['id']]);
                $subcats = $sub_stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Convert subcategory IDs to integers
                foreach($subcats as &$sub) {
                    $sub['id'] = (int)$sub['id'];
                    $sub['category_id'] = (int)$sub['category_id'];
                }
                
                $cat['subcategories'] = $subcats;
            }
            
            echo json_encode(['success' => true, 'categories' => $categories]);
        } catch(Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error loading categories']);
        }
        break;
        
case 'bulk-approve':
    header('Content-Type: application/json');
    
    $type = $_POST['type'] ?? $_GET['type'];
    $station = $_POST['station'] ?? $_GET['station'] ?? null;
    
    try {
        $db->beginTransaction();
        
        switch($type) {
            case 'crime_data':
                $sql = "UPDATE crime_data SET status = 'verified' WHERE status = 'pending'";
                if ($station) {
                    $sql .= " AND police_station = ?";
                    $stmt = $db->prepare($sql);
                    $stmt->execute([$station]);
                } else {
                    $stmt = $db->prepare($sql);
                    $stmt->execute();
                }
                break;
                
            case 'procession_routes':
                $sql = "UPDATE procession_routes SET status = 'approved' WHERE status = 'pending'";
                if ($station) {
                    $sql .= " AND police_station = ?";
                    $stmt = $db->prepare($sql);
                    $stmt->execute([$station]);
                } else {
                    $stmt = $db->prepare($sql);
                    $stmt->execute();
                }
                break;
                
            case 'data_points':
                $sql = "UPDATE data_points SET status = 'verified' WHERE status = 'pending'";
                $stmt = $db->prepare($sql);
                $stmt->execute();
                break;
                
            case 'all':
                // Approve all pending records
                $db->prepare("UPDATE crime_data SET status = 'verified' WHERE status = 'pending'")->execute();
                $db->prepare("UPDATE procession_routes SET status = 'approved' WHERE status = 'pending'")->execute();
                $db->prepare("UPDATE data_points SET status = 'verified' WHERE status = 'pending'")->execute();
                $affected_rows = $db->lastInsertId(); // This won't be accurate for updates, but we'll handle it differently
                break;
                
            default:
                throw new Exception('Invalid approval type');
        }
        
        $affected_rows = $stmt->rowCount();
        $db->commit();
        
        echo json_encode([
            'success' => true,
            'message' => "Approved $affected_rows records",
            'affected_rows' => $affected_rows
        ]);
        
    } catch(Exception $e) {
        $db->rollback();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    break;
    
    case 'upload-gis-layer':
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $layer_name = $_POST['layer_name'] ?? '';
        $layer_type = $_POST['layer_type'] ?? 'geojson';
        $category = $_POST['category'] ?? '';
        
        if (isset($_FILES['layer_file']) && $_FILES['layer_file']['error'] === UPLOAD_ERR_OK) {
            $upload_dir = 'uploads/layers/';
            if (!file_exists($upload_dir)) {
                mkdir($upload_dir, 0777, true);
            }
            
            $file_extension = pathinfo($_FILES['layer_file']['name'], PATHINFO_EXTENSION);
            $file_name = 'layer_' . time() . '_' . uniqid() . '.' . $file_extension;
            $target_path = $upload_dir . $file_name;
            
            if (move_uploaded_file($_FILES['layer_file']['tmp_name'], $target_path)) {
                // Save to database
                $stmt = $db->prepare("INSERT INTO gis_layers 
                    (layer_name, layer_type, category, file_path, is_active) 
                    VALUES (?, ?, ?, ?, 1)");
                $stmt->execute([$layer_name, $layer_type, $category, $target_path]);
                
                echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
            } else {
                echo json_encode(['success' => false, 'message' => 'File upload failed']);
            }
        }
    }
    break;
    
    
    
    case 'get-gis-layers':
    try {
        $stmt = $db->query("
            SELECT * FROM gis_layers 
            WHERE is_active = 1 
            ORDER BY display_order, created_at DESC
        ");
        $layers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Parse style configs
        foreach ($layers as &$layer) {
            $layer['style'] = json_decode($layer['style_config'], true);
        }
        
        echo json_encode([
            'success' => true,
            'layers' => $layers
        ]);
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    break;
    
    case 'toggle-layer':
    try {
        $id = $_GET['id'] ?? 0;
        $stmt = $db->prepare("
            UPDATE gis_layers 
            SET is_active = NOT is_active 
            WHERE id = ?
        ");
        $stmt->execute([$id]);
        
        echo json_encode(['success' => true]);
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    break;

case 'delete-layer':
    try {
        $id = $_GET['id'] ?? 0;
        
        // Get file path first
        $stmt = $db->prepare("SELECT file_path FROM gis_layers WHERE id = ?");
        $stmt->execute([$id]);
        $layer = $stmt->fetch();
        
        // Delete file
        if ($layer && file_exists($layer['file_path'])) {
            unlink($layer['file_path']);
        }
        
        // Delete from database
        $stmt = $db->prepare("DELETE FROM gis_layers WHERE id = ?");
        $stmt->execute([$id]);
        
        echo json_encode(['success' => true]);
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    break;
    
    
    case 'create-data-point':
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $user_id = $_POST['user_id'] ?? null;
        $name = $_POST['name'] ?? null;
        $latitude = $_POST['latitude'] ?? null;
        $longitude = $_POST['longitude'] ?? null;
        $category_id = $_POST['category_id'] ?? null;
        $description = $_POST['description'] ?? '';
        $subcategory_id = $_POST['subcategory_id'] ?? null;
        $accuracy = $_POST['accuracy'] ?? null;
        $altitude = $_POST['altitude'] ?? null;
        $address = $_POST['address'] ?? null;
        
        if (!$user_id || !$name || !$latitude || !$longitude || !$category_id) {
            echo json_encode(['success' => false, 'message' => 'Missing required fields']);
            exit;
        }
        
        $image_path = null;
        $image_url = null;
        
        // Handle image upload to local storage only
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $upload_dir = 'uploads/images/';
            if (!file_exists($upload_dir)) {
                mkdir($upload_dir, 0777, true);
            }
            
            $file_extension = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
            $file_name = 'dp_' . time() . '_' . uniqid() . '.' . $file_extension;
            $target_path = $upload_dir . $file_name;
            
            if (move_uploaded_file($_FILES['image']['tmp_name'], $target_path)) {
                $image_path = $target_path;
                // Use your new domain for URLs
                $image_url = "https://rhtechnology.in/nashik-gis/" . $target_path;
            }
        }
        
        try {
            $stmt = $db->prepare("INSERT INTO data_points 
                (user_id, name, latitude, longitude, category_id, description, 
                 subcategory_id, accuracy, altitude, address, image_path, image_url) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                
            $stmt->execute([
                $user_id, $name, 
                floatval($latitude), floatval($longitude), 
                intval($category_id), $description,
                $subcategory_id ? intval($subcategory_id) : null,
                $accuracy ? floatval($accuracy) : null,
                $altitude ? floatval($altitude) : null,
                $address ?: '',
                $image_path, $image_url
            ]);
            
            echo json_encode(['success' => true, 'data_point_id' => (int)$db->lastInsertId()]);
        } catch(Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }
    }
    break;
    
    
    case 'check-crime-table':
    try {
        // Check if crime_data table exists
        $stmt = $db->query("SHOW TABLES LIKE 'crime_data'");
        $tableExists = $stmt->fetch() !== false;
        
        if (!$tableExists) {
            // Create the table if it doesn't exist
            $createTable = "CREATE TABLE IF NOT EXISTS crime_data (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                crime_number VARCHAR(255),
                police_station VARCHAR(255),
                crime_type VARCHAR(255),
                kalam TEXT,
                description TEXT,
                latitude DECIMAL(10, 8),
                longitude DECIMAL(11, 8),
                location VARCHAR(255),
                crime_date DATETIME,
                status VARCHAR(50),
                image_path VARCHAR(255),
                api_crime_id INT,
                api_response TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )";
            $db->exec($createTable);
            echo json_encode(['success' => true, 'message' => 'Table created']);
        } else {
            // Show table structure
            $stmt = $db->query("DESCRIBE crime_data");
            $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'columns' => $columns]);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    break;
    
    
    
    case 'save-historical-crime':
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $user_id = $_POST['user_id'] ?? 1;
        $incident_date = $_POST['incident_date'] ?? date('Y-m-d');
        $crime_type = $_POST['crime_type'] ?? '';
        $place = $_POST['place'] ?? '';
        $description = $_POST['description'] ?? '';
        $latitude = $_POST['latitude'] ?? 0;
        $longitude = $_POST['longitude'] ?? 0;
        $image_url = $_POST['image_url'] ?? null;
        
        $image_path = null;
        
        // Save image locally as backup
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $upload_dir = 'uploads/historical/';
            if (!file_exists($upload_dir)) {
                mkdir($upload_dir, 0777, true);
            }
            
            $file_name = basename($_FILES['image']['name']);
            $target_path = $upload_dir . $file_name;
            
            if (move_uploaded_file($_FILES['image']['tmp_name'], $target_path)) {
                $image_path = $target_path;
            }
        }
        
        try {
            // Ensure table has image_url column
            $alterTable = "ALTER TABLE historical_crimes 
                          ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) AFTER image_path";
            $db->exec($alterTable);
            
            $stmt = $db->prepare("INSERT INTO historical_crimes 
                (user_id, incident_date, crime_type, place, description, 
                 latitude, longitude, image_path, image_url) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            
            $stmt->execute([$user_id, $incident_date, $crime_type, $place, 
                          $description, $latitude, $longitude, $image_path, $image_url]);
            
            echo json_encode([
                'success' => true, 
                'id' => $db->lastInsertId(),
                'message' => 'Historical crime saved successfully'
            ]);
        } catch(Exception $e) {
            echo json_encode([
                'success' => false, 
                'error' => $e->getMessage()
            ]);
        }
    }
    break;
    
 case 'get-police-stations':
    try {
        // Check if police_stations table exists
        $tableCheck = $db->query("SHOW TABLES LIKE 'police_stations'")->fetch();
        
        if ($tableCheck) {
            // Check which columns exist in the table
            $columnsStmt = $db->query("SHOW COLUMNS FROM police_stations");
            $columns = $columnsStmt->fetchAll(PDO::FETCH_COLUMN);
            
            // Build query based on available columns
            $selectFields = "id, station_name";
            
            if (in_array('station_name_marathi', $columns)) {
                $selectFields .= ", station_name_marathi";
            }
            if (in_array('latitude', $columns)) {
                $selectFields .= ", latitude";
            }
            if (in_array('longitude', $columns)) {
                $selectFields .= ", longitude";
            }
            
            // Query with available fields
            $whereClause = in_array('is_active', $columns) ? "WHERE is_active = 1" : "";
            $orderBy = in_array('station_name_marathi', $columns) ? "ORDER BY station_name_marathi" : "ORDER BY station_name";
            
            $stmt = $db->query("SELECT $selectFields FROM police_stations $whereClause $orderBy");
            $stations = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } else {
            // Table doesn't exist, get from other tables
            $stmt = $db->query("
                SELECT DISTINCT police_station as station_name
                FROM (
                    SELECT police_station FROM users WHERE police_station IS NOT NULL AND police_station != ''
                    UNION
                    SELECT police_station FROM crime_data WHERE police_station IS NOT NULL AND police_station != ''
                    UNION
                    SELECT police_station FROM procession_routes WHERE police_station IS NOT NULL AND police_station != ''
                ) as combined
                WHERE police_station IS NOT NULL
                ORDER BY police_station
            ");
            
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Format as stations array
            $stations = [];
            $id = 1;
            foreach ($results as $row) {
                $stations[] = [
                    'id' => $id++,
                    'station_name' => $row['station_name'],
                    'station_name_marathi' => $row['station_name']
                ];
            }
        }
        
        echo json_encode([
            'success' => true,
            'stations' => $stations
        ]);
        
    } catch(Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error loading police stations: ' . $e->getMessage()
        ]);
    }
    break;
    
    case 'test-login':
    $phone = $_GET['phone'] ?? '';
    
    try {
        $stmt = $db->prepare("SELECT id, name, phone, password FROM users WHERE phone = ?");
        $stmt->execute([$phone]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            echo json_encode([
                'success' => true,
                'user_found' => true,
                'user_id' => $user['id'],
                'name' => $user['name'],
                'has_password' => !empty($user['password']),
                'is_active_check' => 'Check if is_active = 1 in database'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'user_found' => false,
                'message' => 'No user found with this phone number'
            ]);
        }
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    break;
    

case 'get-villages':
    $station_id = $_GET['station_id'] ?? null;
    
    if (!$station_id) {
        echo json_encode(['success' => false, 'message' => 'Station ID required']);
        break;
    }
    
    try {
        // First try to get villages from database
        $stmt = $db->prepare("SELECT id, village_name, village_name_marathi 
                             FROM villages 
                             WHERE police_station_id = ? AND is_active = 1 
                             ORDER BY village_name_marathi");
        $stmt->execute([$station_id]);
        $villages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // If no villages found in database, use fallback based on station
        if (empty($villages)) {
            $villages = getFallbackVillages($station_id);
        }
        
        // Always add "इतर" option at the end
        $villages[] = ['id' => 999, 'village_name_marathi' => 'इतर', 'village_name' => 'Other'];
        
        echo json_encode(['success' => true, 'villages' => $villages]);
    } catch(Exception $e) {
        // Fallback to hardcoded villages if database fails
        $villages = getFallbackVillages($station_id);
        $villages[] = ['id' => 999, 'village_name_marathi' => 'इतर', 'village_name' => 'Other'];
        
        echo json_encode(['success' => true, 'villages' => $villages]);
    }
    break;
    
    case 'get-procession-routes':
    try {
        $byCategory = isset($_GET['by_category']) && $_GET['by_category'] === 'true';
        
        if ($byCategory) {
            // First, get all routes
            $stmt = $db->query("SELECT * FROM procession_routes ORDER BY festival_name, created_at DESC");
            $routes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get festivals for categorization
            $festivalStmt = $db->query("SELECT name, category FROM festivals WHERE is_active = 1");
            $festivals = [];
            while ($fest = $festivalStmt->fetch(PDO::FETCH_ASSOC)) {
                $festivals[$fest['name']] = $fest['category'];
            }
            
            // Categorize routes
            $categorizedRoutes = [];
            foreach ($routes as $route) {
                // Determine category
                $category = 'Other';
                if (isset($festivals[$route['festival_name']])) {
                    $category = $festivals[$route['festival_name']] ?: 'Other';
                }
                
                if (!isset($categorizedRoutes[$category])) {
                    $categorizedRoutes[$category] = [];
                }
                $categorizedRoutes[$category][] = $route;
            }
            
            echo json_encode([
                'success' => true,
                'routes' => $routes,
                'categorized' => $categorizedRoutes,
                'count' => count($routes)
            ]);
        } else {
            // Original query
            $stmt = $db->query("SELECT * FROM procession_routes ORDER BY created_at DESC");
            $routes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'routes' => $routes,
                'count' => count($routes)
            ]);
        }
    } catch(Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ]);
    }
    break;
    
case 'get-route-gap-analysis':
    try {
        // Get all festivals
        $festivalStmt = $db->query("SELECT * FROM festivals WHERE is_active = 1");
        $festivals = $festivalStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get all routes
        $routeStmt = $db->query("SELECT DISTINCT festival_name, police_station, village FROM procession_routes");
        $existingRoutes = $routeStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get all police stations and villages
        $psStmt = $db->query("SELECT DISTINCT police_station FROM data_points WHERE police_station IS NOT NULL");
        $policeStations = $psStmt->fetchAll(PDO::FETCH_COLUMN);
        
        $villageStmt = $db->query("SELECT DISTINCT village FROM data_points WHERE village IS NOT NULL");
        $villages = $villageStmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Analyze gaps
        $gaps = [];
        foreach ($festivals as $festival) {
            $festivalRoutes = array_filter($existingRoutes, function($route) use ($festival) {
                return $route['festival_name'] == $festival['name'];
            });
            
            $coveredPS = array_unique(array_column($festivalRoutes, 'police_station'));
            $coveredVillages = array_unique(array_column($festivalRoutes, 'village'));
            
            $gaps[] = [
                'festival' => $festival,
                'total_routes' => count($festivalRoutes),
                'covered_police_stations' => $coveredPS,
                'uncovered_police_stations' => array_diff($policeStations, $coveredPS),
                'covered_villages' => $coveredVillages,
                'uncovered_villages' => array_diff($villages, $coveredVillages),
                'coverage_percentage' => [
                    'police_stations' => (count($coveredPS) / count($policeStations)) * 100,
                    'villages' => (count($coveredVillages) / count($villages)) * 100
                ]
            ];
        }
        
        echo json_encode([
            'success' => true,
            'gap_analysis' => $gaps,
            'summary' => [
                'total_festivals' => count($festivals),
                'total_police_stations' => count($policeStations),
                'total_villages' => count($villages),
                'total_routes' => count($existingRoutes)
            ]
        ]);
    } catch(Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ]);
    }
    break;
    
    
    case 'debug':
    try {
        // Test database connection
        $stmt = $db->query("SELECT COUNT(*) as count FROM procession_routes");
        $count = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'db_connected' => true,
            'procession_routes_count' => $count['count'],
            'message' => 'Database connection successful'
        ]);
    } catch(Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
    break;

    case 'register':
        $name = $_GET['name'] ?? '';
        $phone = $_GET['phone'] ?? '';
        $email = $_GET['email'] ?? '';
        $password = $_GET['password'] ?? '';
        
        if (empty($name) || empty($phone) || empty($password)) {
            echo json_encode(['success' => false, 'message' => 'Required fields missing']);
            exit;
        }
        
        try {
            // Check if user exists
            $stmt = $db->prepare("SELECT id FROM users WHERE phone = ?");
            $stmt->execute([$phone]);
            if ($stmt->fetch()) {
                echo json_encode(['success' => false, 'message' => 'Phone number already registered']);
                exit;
            }
            
            // Create user with password
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $db->prepare("INSERT INTO users (name, phone, email, password, role) VALUES (?, ?, ?, ?, 'data_collector')");
            $stmt->execute([$name, $phone, $email, $hashedPassword]);
            
            echo json_encode([
                'success' => true,
                'user_id' => (int)$db->lastInsertId(),
                'message' => 'Registration successful'
            ]);
        } catch(Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Registration failed']);
        }
        break;
        
    case 'data-points':
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
        $offset = ($page - 1) * $limit;
        
        // Build query with filters
        $where = "WHERE 1=1";
        $params = [];
        
        // Category filter
        if (isset($_GET['category']) && $_GET['category']) {
            $where .= " AND dp.category_id = ?";
            $params[] = $_GET['category'];
        }
        
        // Status filter
        if (isset($_GET['status']) && $_GET['status']) {
            $where .= " AND dp.status = ?";
            $params[] = $_GET['status'];
        }
        
        // Date filter
        if (isset($_GET['date']) && $_GET['date']) {
            $where .= " AND DATE(dp.created_at) = ?";
            $params[] = $_GET['date'];
        }
        
        try {
            // Get total count
            $countQuery = "SELECT COUNT(*) as total FROM data_points dp $where";
            $countStmt = $db->prepare($countQuery);
            $countStmt->execute($params);
            $totalCount = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            // Get data points
            $query = "SELECT dp.*, 
                             u.name as user_name,
                             c.name as category_name, 
                             c.color as category_color,
                             c.icon as category_icon,
                             sc.name as subcategory_name
                      FROM data_points dp
                      LEFT JOIN users u ON dp.user_id = u.id
                      LEFT JOIN categories c ON dp.category_id = c.id
                      LEFT JOIN subcategories sc ON dp.subcategory_id = sc.id
                      $where
                      ORDER BY dp.created_at DESC
                      LIMIT ? OFFSET ?";
            
            $params[] = $limit;
            $params[] = $offset;
            
            $stmt = $db->prepare($query);
            $stmt->execute($params);
            
            $data_points = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                // Convert numeric strings to proper types
                $data_points[] = [
                    'id' => (int)$row['id'],
                    'name' => $row['name'],
                    'description' => $row['description'],
                    'latitude' => (float)$row['latitude'],
                    'longitude' => (float)$row['longitude'],
                    'accuracy' => $row['accuracy'] ? (float)$row['accuracy'] : null,
                    'altitude' => $row['altitude'] ? (float)$row['altitude'] : null,
                    'address' => $row['address'],
                    'user_name' => $row['user_name'],
                    'user_id' => (int)$row['user_id'],
                    'category_id' => (int)$row['category_id'],
                    'category_name' => $row['category_name'],
                    'category_color' => $row['category_color'],
                    'category_icon' => $row['category_icon'],
                    'subcategory_name' => $row['subcategory_name'],
                    'status' => $row['status'] ?: 'pending',
                    'image_path' => $row['image_path'],
                    'additional_info' => $row['additional_info'],
                    'created_at' => $row['created_at'],
                    'updated_at' => $row['updated_at']
                ];
            }
            
            echo json_encode([
                'success' => true,
                'data_points' => $data_points,
                'total_count' => (int)$totalCount,
                'page' => $page,
                'pages' => ceil($totalCount / $limit)
            ]);
            
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Error fetching data points: ' . $e->getMessage()
            ]);
        }
        break;
        
        

    case 'stats':
        try {
            $stats = [];
            
            // Total data points
            $query = "SELECT COUNT(*) as total FROM data_points";
            $stmt = $db->query($query);
            $stats['total'] = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            // Verified points
            $query = "SELECT COUNT(*) as count FROM data_points WHERE status = 'verified'";
            $stmt = $db->query($query);
            $stats['verified'] = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            // Pending points
            $query = "SELECT COUNT(*) as count FROM data_points WHERE status = 'pending' OR status IS NULL";
            $stmt = $db->query($query);
            $stats['pending'] = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            // Rejected points
            $query = "SELECT COUNT(*) as count FROM data_points WHERE status = 'rejected'";
            $stmt = $db->query($query);
            $stats['rejected'] = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            // Total users
            $query = "SELECT COUNT(*) as count FROM users WHERE is_active = 1";
            $stmt = $db->query($query);
            $stats['users'] = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            echo json_encode([
                'success' => true,
                'total' => $stats['total'],
                'verified' => $stats['verified'],
                'pending' => $stats['pending'],
                'rejected' => $stats['rejected'],
                'users' => $stats['users']
            ]);
            
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Error fetching stats: ' . $e->getMessage()
            ]);
        }
        break;

    case 'update-status':
        // Get raw POST data
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!isset($data['id']) || !isset($data['status'])) {
            echo json_encode(['success' => false, 'message' => 'ID and status required']);
            exit;
        }
        
        try {
            $query = "UPDATE data_points SET status = ?, updated_at = NOW() WHERE id = ?";
            $stmt = $db->prepare($query);
            $stmt->execute([$data['status'], $data['id']]);
            
            if ($stmt->rowCount() > 0) {
                echo json_encode(['success' => true, 'message' => 'Status updated']);
            } else {
                echo json_encode(['success' => false, 'message' => 'No record found']);
            }
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error updating status']);
        }
        break;

    case 'delete-point':
        $id = $_GET['id'] ?? 0;
        
        try {
            $stmt = $db->prepare("DELETE FROM data_points WHERE id = ?");
            $stmt->execute([$id]);
            
            if ($stmt->rowCount() > 0) {
                echo json_encode(['success' => true, 'message' => 'Data point deleted']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Data point not found']);
            }
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error deleting data point']);
        }
        break;

    case 'get-point':
        $id = $_GET['id'] ?? 0;
        
        try {
            $query = "SELECT dp.*, 
                             u.name as user_name, u.phone as user_phone,
                             c.name as category_name, 
                             sc.name as subcategory_name
                      FROM data_points dp
                      LEFT JOIN users u ON dp.user_id = u.id
                      LEFT JOIN categories c ON dp.category_id = c.id
                      LEFT JOIN subcategories sc ON dp.subcategory_id = sc.id
                      WHERE dp.id = ?";
            
            $stmt = $db->prepare($query);
            $stmt->execute([$id]);
            $point = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($point) {
                echo json_encode(['success' => true, 'data' => $point]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Data point not found']);
            }
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error fetching data point']);
        }
        break;

    case 'user-stats':
        $user_id = $_GET['user_id'] ?? 0;
        
        try {
            // Get user data count
            $stmt = $db->prepare("SELECT COUNT(*) as total FROM data_points WHERE user_id = ?");
            $stmt->execute([$user_id]);
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Get recent entries
            $stmt = $db->prepare("SELECT * FROM data_points WHERE user_id = ? ORDER BY created_at DESC LIMIT 10");
            $stmt->execute([$user_id]);
            $recent = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'total_entries' => (int)$stats['total'],
                'recent_entries' => $recent
            ]);
        } catch(Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error loading stats']);
        }
        break;
        
    case 'save-crime':
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $user_id = $_POST['user_id'] ?? '1';
        $crime_number = $_POST['crime_number'] ?? '';
        $police_station = $_POST['police_station'] ?? '';
        $crime_type = $_POST['crime_type'] ?? '';
        $kalam = $_POST['kalam'] ?? '';
        $description = $_POST['description'] ?? '';
        $latitude = $_POST['latitude'] ?? '0';
        $longitude = $_POST['longitude'] ?? '0';
        $timestamp = $_POST['timestamp'] ?? date('Y-m-d H:i:s');
        $image_url = $_POST['image_url'] ?? null;
        $api_crime_id = $_POST['api_crime_id'] ?? null;
        $api_response = $_POST['api_response'] ?? null;
        
        $image_path = null;
        
        // Handle image upload
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $upload_dir = 'uploads/crime/';
            if (!file_exists($upload_dir)) {
                mkdir($upload_dir, 0777, true);
            }
            
            $file_extension = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
            $file_name = 'crime_' . time() . '_' . uniqid() . '.' . $file_extension;
            $target_path = $upload_dir . $file_name;
            
            if (move_uploaded_file($_FILES['image']['tmp_name'], $target_path)) {
                $image_path = $target_path;
                if (!$image_url) {
                    $image_url = "https://rhtechnology.in/nashik-gis/" . $target_path;
                }
            }
        }
        
        try {
            // Ensure table structure is correct
            $stmt = $db->prepare("INSERT INTO crime_data 
                (user_id, crime_number, police_station, crime_type, kalam, 
                 description, latitude, longitude, crime_date, status,
                 image_path, image_url, api_crime_id, api_response) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)");
            
            $result = $stmt->execute([
                $user_id, 
                $crime_number, 
                $police_station, 
                $crime_type, 
                $kalam,
                $description, 
                floatval($latitude), 
                floatval($longitude), 
                $timestamp,
                $image_path, 
                $image_url, 
                $api_crime_id, 
                $api_response
            ]);
            
            if ($result) {
                echo json_encode([
                    'success' => true,
                    'id' => $db->lastInsertId(),
                    'message' => 'Crime data saved successfully'
                ]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Database insert failed']);
            }
        } catch(Exception $e) {
            error_log("Crime save error: " . $e->getMessage());
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    } else {
        echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    }
    break;
    
    case 'change-password':
        $user_id = $_GET['user_id'] ?? 0;
        $old_password = $_GET['old_password'] ?? '';
        $new_password = $_GET['new_password'] ?? '';
        
        try {
            $stmt = $db->prepare("SELECT password FROM users WHERE id = ?");
            $stmt->execute([$user_id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user && password_verify($old_password, $user['password'])) {
                $hashedPassword = password_hash($new_password, PASSWORD_DEFAULT);
                $stmt = $db->prepare("UPDATE users SET password = ? WHERE id = ?");
                $stmt->execute([$hashedPassword, $user_id]);
                echo json_encode(['success' => true, 'message' => 'Password changed']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Invalid old password']);
            }
        } catch(Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error changing password']);
        }
        break;

    case 'get-profile':
        $user_id = $_GET['user_id'] ?? 0;
        
        try {
            $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
            $stmt->execute([$user_id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user) {
                unset($user['password']); // Don't send password
                
                // Get statistics
                $stmt = $db->prepare("
                    SELECT 
                        COUNT(*) as total_points,
                        COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified_points,
                        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_points,
                        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as week_points
                    FROM data_points 
                    WHERE user_id = ?
                ");
                $stmt->execute([$user_id]);
                $stats = $stmt->fetch(PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true,
                    'user' => $user,
                    'stats' => $stats
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'User not found']);
            }
        } catch(Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error loading profile']);
        }
        break;

    case 'update-profile':
    $user_id = $_POST['user_id'] ?? 0;
    $name = $_POST['name'] ?? '';
    $email = $_POST['email'] ?? '';
    $police_station = $_POST['police_station'] ?? '';
    
    try {
        $stmt = $db->prepare("UPDATE users SET name = ?, email = ?, police_station = ? WHERE id = ?");
        $result = $stmt->execute([$name, $email, $police_station, $user_id]);
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Profile updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update profile']);
        }
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error updating profile']);
    }
    break;

    case 'user-history':
        $user_id = $_GET['user_id'] ?? 0;
        $page = $_GET['page'] ?? 1;
        $limit = 20;
        $offset = ($page - 1) * $limit;
        
        try {
            $stmt = $db->prepare("
                SELECT dp.*, c.name as category_name, c.color, sc.name as subcategory_name 
                FROM data_points dp
                LEFT JOIN categories c ON dp.category_id = c.id
                LEFT JOIN subcategories sc ON dp.subcategory_id = sc.id
                WHERE dp.user_id = ?
                ORDER BY dp.created_at DESC
                LIMIT ? OFFSET ?
            ");
            $stmt->bindValue(1, $user_id, PDO::PARAM_INT);
            $stmt->bindValue(2, $limit, PDO::PARAM_INT);
            $stmt->bindValue(3, $offset, PDO::PARAM_INT);
            $stmt->execute();
            
            $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'history' => $history,
                'page' => $page,
                'has_more' => count($history) == $limit
            ]);
        } catch(Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error loading history']);
        }
          break;
          
  case 'debug-route-save':
    header('Content-Type: application/json');
    
    // Get raw POST data
    $rawData = file_get_contents('php://input');
    $input = json_decode($rawData, true);
    
    $debug = [
        'timestamp' => date('Y-m-d H:i:s'),
        'raw_data_length' => strlen($rawData),
        'raw_data_preview' => substr($rawData, 0, 500),
        'json_decode_success' => $input !== null,
        'input_keys' => $input ? array_keys($input) : null,
        'required_fields_check' => [],
        'coordinate_check' => [],
        'village_check' => [],
    ];
    
    if ($input) {
        // Check required fields
        $requiredFields = ['police_station', 'festival_name'];
        foreach ($requiredFields as $field) {
            $debug['required_fields_check'][$field] = [
                'exists' => isset($input[$field]),
                'empty' => empty($input[$field]),
                'value' => $input[$field] ?? 'NOT_SET'
            ];
        }
        
        // Check coordinates
        $debug['coordinate_check'] = [
            'start_point_exists' => isset($input['start_point']),
            'start_lat' => $input['start_point']['latitude'] ?? 'NOT_SET',
            'start_lng' => $input['start_point']['longitude'] ?? 'NOT_SET',
            'end_point_exists' => isset($input['end_point']),
            'end_lat' => $input['end_point']['latitude'] ?? 'NOT_SET',
            'end_lng' => $input['end_point']['longitude'] ?? 'NOT_SET',
        ];
        
        // Check village
        $village_id = $input['village_id'] ?? null;
        if ($village_id !== null && $village_id > 0) {
            try {
                $checkStmt = $db->prepare("SELECT id FROM villages WHERE id = ?");
                $checkStmt->execute([$village_id]);
                $villageExists = $checkStmt->fetch() !== false;
                $debug['village_check'] = [
                    'village_id' => $village_id,
                    'exists_in_db' => $villageExists
                ];
            } catch (Exception $e) {
                $debug['village_check'] = [
                    'village_id' => $village_id,
                    'check_error' => $e->getMessage()
                ];
            }
        } else {
            $debug['village_check'] = [
                'village_id' => $village_id,
                'will_use_null' => true
            ];
        }
    }
    
    echo json_encode($debug, JSON_PRETTY_PRINT);
    break;   
          
   case 'save-procession-route':
    header('Content-Type: application/json');
    error_log("=== PROCESSION ROUTE SAVE START ===");
    
    // Get raw POST data
    $rawData = file_get_contents('php://input');
    error_log("Raw data received: " . $rawData);
    
    $input = json_decode($rawData, true);
    
    if (!$input) {
        $error = "No data received or invalid JSON";
        error_log("Error: " . $error);
        echo json_encode(['success' => false, 'error' => $error]);
        break;
    }
    
    try {
        // Validate required fields
        $requiredFields = ['police_station', 'festival_name'];
        foreach ($requiredFields as $field) {
            if (!isset($input[$field]) || empty($input[$field])) {
                throw new Exception("Missing required field: $field");
            }
        }
        
        // Check coordinate data
        if (!isset($input['start_point']['latitude']) || !isset($input['start_point']['longitude']) ||
            !isset($input['end_point']['latitude']) || !isset($input['end_point']['longitude'])) {
            throw new Exception('Missing coordinate data');
        }
        
        $user_id = isset($input['user_id']) ? intval($input['user_id']) : 1;
        $village_id = intval($input['village_id'] ?? 0);
        
        // If village_id is 0 or doesn't exist, set it to NULL to avoid foreign key constraint
        if ($village_id <= 0) {
            $village_id = null;
        } else {
            // Check if village_id exists in villages table
            $checkStmt = $db->prepare("SELECT id FROM villages WHERE id = ?");
            $checkStmt->execute([$village_id]);
            if (!$checkStmt->fetch()) {
                $village_id = null; // Village doesn't exist, set to NULL
            }
        }
        
        // SQL query with proper NULL handling
        $sql = "INSERT INTO procession_routes (
            user_id, police_station, village, village_id,
            festival_name, procession_number,
            start_point_lat, start_point_lng,
            end_point_lat, end_point_lng,
            start_address, end_address,
            route_coordinates, total_distance,
            description, status
        ) VALUES (
            :user_id, :police_station, :village, :village_id,
            :festival_name, :procession_number,
            :start_lat, :start_lng,
            :end_lat, :end_lng,
            :start_address, :end_address,
            :route_coordinates, :total_distance,
            :description, 'pending'
        )";
        
        $stmt = $db->prepare($sql);
        
        if (!$stmt) {
            throw new Exception('Failed to prepare statement: ' . implode(' ', $db->errorInfo()));
        }
        
        $route_json = json_encode($input['route_points'] ?? []);
        
        $params = [
            ':user_id' => $user_id,
            ':police_station' => trim($input['police_station']),
            ':village' => trim($input['village'] ?? ''),
            ':village_id' => $village_id, // This will be NULL if invalid
            ':festival_name' => trim($input['festival_name']),
            ':procession_number' => trim($input['procession_number'] ?? ''),
            ':start_lat' => floatval($input['start_point']['latitude']),
            ':start_lng' => floatval($input['start_point']['longitude']),
            ':end_lat' => floatval($input['end_point']['latitude']),
            ':end_lng' => floatval($input['end_point']['longitude']),
            ':start_address' => $input['start_address'] ?? '',
            ':end_address' => $input['end_address'] ?? '',
            ':route_coordinates' => $route_json,
            ':total_distance' => floatval($input['total_distance'] ?? 0),
            ':description' => $input['description'] ?? ''
        ];
        
        error_log("SQL params: " . print_r($params, true));
        
        $success = $stmt->execute($params);
        
        if ($success) {
            $insertId = $db->lastInsertId();
            error_log("Route saved successfully with ID: " . $insertId);
            
            echo json_encode([
                'success' => true,
                'message' => 'Route saved successfully',
                'id' => $insertId
            ]);
        } else {
            $errorInfo = $stmt->errorInfo();
            throw new Exception('Database error: ' . $errorInfo[2]);
        }
    } catch (Exception $e) {
        error_log("Route save error: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
    
    error_log("=== PROCESSION ROUTE SAVE END ===");
    break;
    
    
case 'test-procession-save':
    header('Content-Type: application/json');
    
    try {
        $sql = "INSERT INTO procession_routes (
            user_id, police_station, village, village_id,
            festival_name, procession_number,
            start_point_lat, start_point_lng,
            end_point_lat, end_point_lng,
            start_address, end_address,
            route_coordinates, total_distance,
            description, status
        ) VALUES (
            1, 'Test Police Station', 'Test Village', NULL,
            'Test Festival', 'Test-1',
            20.0074, 73.7898,
            20.0075, 73.7899,
            'Test Start Address', 'Test End Address',
            ?, 100.5,
            'Test Description', 'pending'
        )";
        
        $stmt = $db->prepare($sql);
        $routeData = json_encode([
            ['latitude' => 20.0074, 'longitude' => 73.7898],
            ['latitude' => 20.0075, 'longitude' => 73.7899]
        ]);
        
        $success = $stmt->execute([$routeData]);
        
        if ($success) {
            $insertId = $db->lastInsertId();
            echo json_encode([
                'success' => true,
                'message' => 'Test route saved successfully',
                'id' => $insertId
            ]);
        } else {
            $errorInfo = $stmt->errorInfo();
            echo json_encode(['success' => false, 'error' => 'Database error: ' . $errorInfo[2]]);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    break;
    
case 'check-villages':
    try {
        $stmt = $db->query("SELECT * FROM villages LIMIT 10");
        $villages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'villages' => $villages,
            'count' => count($villages)
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    break;
    
    
case 'check-procession-table':
    try {
        // Check if table exists
        $tableCheck = $db->query("SHOW TABLES LIKE 'procession_routes'");
        if ($tableCheck->rowCount() == 0) {
            echo json_encode(['success' => false, 'error' => 'Table does not exist']);
            break;
        }
        
        // Get table structure
        $stmt = $db->query("DESCRIBE procession_routes");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Check if we can insert a test record
        $testInsert = $db->prepare("INSERT INTO procession_routes 
            (user_id, police_station, festival_name, start_point_lat, start_point_lng, 
             end_point_lat, end_point_lng, route_coordinates, total_distance, status) 
            VALUES (1, 'Test Station', 'Test Festival', 20.0074, 73.7898, 
                    20.0075, 73.7899, '[]', 100, 'pending')");
        
        $canInsert = $testInsert->execute();
        if ($canInsert) {
            $testId = $db->lastInsertId();
            // Clean up test record
            $db->prepare("DELETE FROM procession_routes WHERE id = ?")->execute([$testId]);
        }
        
        echo json_encode([
            'success' => true,
            'table_exists' => true,
            'columns' => $columns,
            'can_insert' => $canInsert
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    break;    
    
case 'test-route-data':
    $rawData = file_get_contents('php://input');
    $input = json_decode($rawData, true);
    
    echo json_encode([
        'success' => true,
        'received' => [
            'police_station' => $input['police_station'] ?? 'MISSING',
            'festival_name' => $input['festival_name'] ?? 'MISSING',
            'points_count' => count($input['route_points'] ?? []),
            'start_lat' => $input['start_point']['latitude'] ?? 'MISSING',
            'total_distance' => $input['total_distance'] ?? 'MISSING'
        ]
    ]);
    break;
    
    
 case 'check-table':
    try {
        $stmt = $db->query("DESCRIBE procession_routes");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'columns' => $columns]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    break;
    
 case 'test-procession-save':
    header('Content-Type: application/json');
    $input = json_decode(file_get_contents('php://input'), true);
    echo json_encode([
        'success' => true,
        'message' => 'Test endpoint working',
        'received_data' => $input ? 'Yes' : 'No',
        'method' => $_SERVER['REQUEST_METHOD']
    ]);
    break;
    
    default:
        echo json_encode(['success' => false, 'message' => 'Unknown endpoint: ' . $endpoint]);
        break;
}
?>