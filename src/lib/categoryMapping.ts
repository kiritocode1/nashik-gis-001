/**
 * Category name mapping for the Nashik GIS application.
 * 
 * The database has incorrect category names that don't match their subcategories.
 * This mapping provides the correct display names based on what the subcategories actually contain.
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
