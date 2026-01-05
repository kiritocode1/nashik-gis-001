/**
 * Category and Subcategory mapping for the Nashik GIS application.
 * 
 * The database has incorrect category names that don't match their subcategories.
 * This mapping provides the correct display names and emojis based on what the data actually contains.
 * 
 * This is a temporary client-side fix until the database is corrected.
 */

// Map of incorrect database category names to their correct display names
export const CATEGORY_NAME_MAP: Record<string, string> = {
    // "Colleges" contains religious places, monuments, disputed religious sites
    "Colleges": "सामाजिक/धार्मिक स्थळे",

    // "Mandal Office" contains tourism-related subcategories
    "Mandal Office": "पर्यटन स्थळे",

    // "Mining" contains crime types (burglary, motorcycle theft)
    "Mining": "गुन्हे नोंद",

    // "Police Stations" contains CCTV-related subcategories
    "Police Stations": "CCTV",

    // "Railway Stations" contains toll booths and petrol pumps
    "Railway Stations": "वाहतूक सुविधा",

    // "SDO Office" contains emergency services (fire, civil defense, homeguard)
    "SDO Office": "आपत्कालीन सेवा",

    // "Stone Crusher" contains industrial areas and factories
    "Stone Crusher": "औद्योगिक क्षेत्र",

    // "Talathi Office" contains accused/suspect tracking
    "Talathi Office": "आरोपी माहिती",

    // "Temple" actually contains police infrastructure
    "Temple": "पोलीस यंत्रणा",

    // "Tourist Places" - keep as is (correct name)
    "Tourist Places": "पर्यटन स्थळे (Tourist)",
};

// English translations for the mapped names (for accessibility)
export const CATEGORY_NAME_MAP_EN: Record<string, string> = {
    "Colleges": "Social/Religious Places",
    "Mandal Office": "Tourism",
    "Mining": "Crime Records",
    "Police Stations": "CCTV Cameras",
    "Railway Stations": "Transport Facilities",
    "SDO Office": "Emergency Services",
    "Stone Crusher": "Industrial Areas",
    "Talathi Office": "Accused/Suspects",
    "Temple": "Police Infrastructure",
    "Tourist Places": "Tourist Places",
};

// Icon mapping for corrected categories (more appropriate icons)
export const CATEGORY_ICON_MAP: Record<string, string> = {
    "Colleges": "🛕",           // Religious/social places
    "Mandal Office": "🏛️",     // Tourism
    "Mining": "📋",             // Crime records
    "Police Stations": "📹",    // CCTV
    "Railway Stations": "⛽",   // Transport/fuel
    "SDO Office": "🚒",         // Emergency
    "Stone Crusher": "🏭",      // Industrial
    "Talathi Office": "👤",     // Accused tracking
    "Temple": "👮",             // Police
    "Tourist Places": "🏞️",    // Tourism
};

/**
 * Comprehensive subcategory emoji mapping
 * Maps subcategory names (Marathi/English) to appropriate emojis for map pins
 */
export const SUBCATEGORY_EMOJI_MAP: Record<string, string> = {
    // ============ Police Infrastructure (Category: Temple) ============
    "पोलीस स्टेशन": "🚔",
    "पोलीस चौकी": "🏛️",
    "SDPO कार्यालय": "🏢",
    "पोलीस इमारती": "🏗️",
    "HSP मदत केंद्र": "🆘",
    "पोलीस मालकीच्या खुल्या जमिनी": "🗺️",
    "वायरलेस रिपीटर्स": "📡",

    // ============ CCTV Types (Category: Police Stations) ============
    "सरकारी CCTV": "🎥",
    "निम-सरकारी CCTV": "📹",
    "खाजगी CCTV": "📷",
    "पेट्रोल पंप CCTV": "⛽",
    "बँक CCTV": "🏦",
    "ATM CCTV": "🏧",
    "सोसायटी CCTV": "🏘️",
    "शाळा CCTV": "🏫",
    "सार्वजनिक बागा CCTV": "🌳",
    "बाजार पेठ CCTV": "🏪",

    // ============ Religious/Social Places (Category: Colleges) ============
    "धार्मिक स्थळे": "🛕",
    "विवादित धार्मिक स्थळे": "⚠️",
    "स्मारके / पुतळे": "🗿",
    "मर्मस्थळे": "📍",
    "माध पर्यटन": "🎭",

    // ============ Tourism (Category: Mandal Office) ============
    "ऐतिहासिक स्थळे": "🏰",
    "धार्मिक पर्यटन": "⛩️",
    "निसर्ग पर्यटन": "🏞️",

    // ============ Transport Facilities (Category: Railway Stations) ============
    "पेट्रोल पंप": "⛽",
    "टोल नाका": "🛣️",

    // ============ Emergency Services (Category: SDO Office) ============
    "अग्निशमन केंद्र": "🚒",
    "नागरी संरक्षण": "🛡️",
    "होमगार्ड": "💂",

    // ============ Industrial (Category: Stone Crusher) ============
    "औद्योगिक क्षेत्र": "🏭",
    "कारखाने": "🏭",

    // ============ Accused/Suspects (Category: Talathi Office) ============
    "सक्रिय आरोपी": "🔴",
    "जामीनावर आरोपी": "🟡",
    "फरार आरोपी": "🏃",

    // ============ Crime Records (Category: Mining) ============
    "घरफोडी": "🏠",
    "मोटारसायकल चोरी": "🏍️",

    // ============ Generic/Other ============
    "इतर": "📌",

    // ============ English fallbacks ============
    "Police Station": "🚔",
    "Police Stations": "🚔",
    "Hospital": "🏥",
    "Hospitals": "🏥",
    "ATM": "🏧",
    "Bank": "🏦",
    "School": "🏫",
    "College": "🎓",
    "Temple": "🛕",
    "Mosque": "🕌",
    "Church": "⛪",
    "Fire Station": "🚒",
    "Petrol Pump": "⛽",
    "Gas Station": "⛽",
    "Factory": "🏭",
    "Industry": "🏭",
    "CCTV": "📹",
    "Camera": "📷",
    "Monument": "🗿",
    "Park": "🌳",
    "Garden": "🌺",
    "Market": "🏪",
    "Shopping": "🛒",
    "Tourist": "🏞️",
    "Historical": "🏰",
    "Religious": "🛕",
    "Emergency": "🚨",
    "Accused": "👤",
    "Criminal": "🔴",
    "Crime": "📋",
};

/**
 * Get the correct display name for a category
 * @param originalName - The original (incorrect) category name from the database
 * @returns The corrected display name, or the original if no mapping exists
 */
export function getCategoryDisplayName(originalName: string): string {
    return CATEGORY_NAME_MAP[originalName] || originalName;
}

/**
 * Get the English display name for a category
 * @param originalName - The original (incorrect) category name from the database
 * @returns The English display name, or the original if no mapping exists
 */
export function getCategoryDisplayNameEN(originalName: string): string {
    return CATEGORY_NAME_MAP_EN[originalName] || originalName;
}

/**
 * Get the appropriate icon for a category
 * @param originalName - The original category name from the database
 * @returns The corrected icon emoji, or a default pin icon
 */
export function getCategoryIcon(originalName: string): string {
    return CATEGORY_ICON_MAP[originalName] || "📍";
}

/**
 * Get the appropriate emoji for a subcategory
 * Uses exact match first, then partial matching for flexibility
 * @param subcategoryName - The subcategory name (Marathi or English)
 * @param categoryName - Optional category name for fallback
 * @returns The appropriate emoji for the subcategory
 */
export function getSubcategoryEmoji(subcategoryName: string, categoryName?: string): string {
    // Exact match
    if (SUBCATEGORY_EMOJI_MAP[subcategoryName]) {
        return SUBCATEGORY_EMOJI_MAP[subcategoryName];
    }

    // Try lowercase match
    const lowerName = subcategoryName.toLowerCase();
    for (const [key, emoji] of Object.entries(SUBCATEGORY_EMOJI_MAP)) {
        if (key.toLowerCase() === lowerName) {
            return emoji;
        }
    }

    // Partial match - check if subcategory name contains any key
    for (const [key, emoji] of Object.entries(SUBCATEGORY_EMOJI_MAP)) {
        if (subcategoryName.includes(key) || key.includes(subcategoryName)) {
            return emoji;
        }
    }

    // Pattern-based matching for common terms
    if (subcategoryName.includes("CCTV") || subcategoryName.includes("cctv")) {
        return "📹";
    }
    if (subcategoryName.includes("पोलीस") || subcategoryName.toLowerCase().includes("police")) {
        return "🚔";
    }
    if (subcategoryName.includes("धार्मिक") || subcategoryName.toLowerCase().includes("religious")) {
        return "🛕";
    }
    if (subcategoryName.includes("पर्यटन") || subcategoryName.toLowerCase().includes("tourist")) {
        return "🏞️";
    }
    if (subcategoryName.includes("आरोपी") || subcategoryName.toLowerCase().includes("accused")) {
        return "👤";
    }

    // Fall back to category icon if provided
    if (categoryName && CATEGORY_ICON_MAP[categoryName]) {
        return CATEGORY_ICON_MAP[categoryName];
    }

    // Default pin
    return "📍";
}

/**
 * Transform a category object to have the correct display name
 * @param category - The category object from the API
 * @returns The category object with corrected name
 */
export function transformCategory<T extends { name: string }>(category: T): T & { originalName: string; displayName: string } {
    return {
        ...category,
        originalName: category.name,
        displayName: getCategoryDisplayName(category.name),
    };
}

/**
 * Transform an array of categories to have correct display names
 * @param categories - Array of category objects from the API
 * @returns Array of categories with corrected names
 */
export function transformCategories<T extends { name: string }>(categories: T[]): (T & { originalName: string; displayName: string })[] {
    return categories.map(transformCategory);
}
