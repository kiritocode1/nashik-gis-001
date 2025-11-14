import { ENDPOINT_CONFIGS, type EndpointConfig } from "@/lib/schemas";
import { z } from "zod";

export interface HealthCheckResult {
	endpoint: string;
	name: string;
	description: string;
	status: "success" | "error" | "timeout";
	responseTime: number;
	dataSample?: unknown[];
	schemaValidation: {
		isValid: boolean;
		errors?: z.ZodError;
	};
	schemaDifferences?: {
		missingFields: string[];
		extraFields: string[];
		typeMismatches: Array<{
			field: string;
			expected: string;
			actual: string;
		}>;
	};
	error?: string;
}

const BASE_URL = "https://rhtechnology.in/nashik-gis/app.php";

export async function testEndpoint(config: EndpointConfig): Promise<HealthCheckResult> {
	const startTime = Date.now();

	try {
		const url = `${BASE_URL}?endpoint=${config.endpoint}`;
		console.log(`Testing endpoint: ${config.name} (${url})`);

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

		const response = await fetch(url, {
			signal: controller.signal,
			headers: {
				Accept: "application/json",
				"User-Agent": "Nashik-GIS-HealthCheck/1.0",
			},
		});

		clearTimeout(timeoutId);
		const responseTime = Date.now() - startTime;

		if (!response.ok) {
			return {
				endpoint: config.endpoint,
				name: config.name,
				description: config.description,
				status: "error",
				responseTime,
				schemaValidation: { isValid: false },
				error: `HTTP ${response.status}: ${response.statusText}`,
			};
		}

		const data = await response.json();

		// Get first 5 items for sample data
		let dataSample = [];

		if (Array.isArray(data.data)) {
			dataSample = data.data.slice(0, 5);
		} else if (Array.isArray(data.data_points)) {
			// For map data, filter police stations if this is the police stations endpoint
			if (config.name === "Police Stations") {
				const policeStations = data.data_points.filter((item: { category_name: string }) => item.category_name === "पोलीस आस्थापना");
				if (policeStations.length > 0) {
					dataSample = policeStations.slice(0, 5);
				} else {
					// Fallback: show first 5 data points if no police stations found
					dataSample = data.data_points.slice(0, 5);
				}
			} else {
				dataSample = data.data_points.slice(0, 5);
			}
		} else if (Array.isArray(data.stations)) {
			dataSample = data.stations.slice(0, 5);
		} else if (Array.isArray(data.features)) {
			dataSample = data.features.slice(0, 5);
		} else if (Array.isArray(data.routes)) {
			dataSample = data.routes.slice(0, 5);
		} else if (Array.isArray(data.categories)) {
			dataSample = data.categories.slice(0, 5);
		} else if (Array.isArray(data.nodes)) {
			dataSample = data.nodes.slice(0, 5);
		} else if (Array.isArray(data.alerts)) {
			dataSample = data.alerts.slice(0, 5);
		} else if (Array.isArray(data.items)) {
			dataSample = data.items.slice(0, 5);
		} else if (Array.isArray(data.gap_analysis)) {
			dataSample = data.gap_analysis.slice(0, 5);
		} else if (Array.isArray(data.festivals)) {
			dataSample = data.festivals.slice(0, 5);
		}

		// Validate against schema
		const validationResult = config.schema.safeParse(data);

		let schemaDifferences;
		if (!validationResult.success) {
			schemaDifferences = analyzeSchemaDifferences(data, config.schema, validationResult.error);
		}

		return {
			endpoint: config.endpoint,
			name: config.name,
			description: config.description,
			status: "success",
			responseTime,
			dataSample,
			schemaValidation: {
				isValid: validationResult.success,
				errors: validationResult.success ? undefined : validationResult.error,
			},
			schemaDifferences,
		};
	} catch (error) {
		const responseTime = Date.now() - startTime;

		if (error instanceof Error && error.name === "AbortError") {
			return {
				endpoint: config.endpoint,
				name: config.name,
				description: config.description,
				status: "timeout",
				responseTime,
				schemaValidation: { isValid: false },
				error: "Request timeout after 15 seconds",
			};
		}

		return {
			endpoint: config.endpoint,
			name: config.name,
			description: config.description,
			status: "error",
			responseTime,
			schemaValidation: { isValid: false },
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

function analyzeSchemaDifferences(data: unknown, schema: z.ZodSchema, error: z.ZodError) {
	const missingFields: string[] = [];
	const extraFields: string[] = [];
	const typeMismatches: Array<{ field: string; expected: string; actual: string }> = [];

	// Analyze Zod errors
	error.issues.forEach((issue) => {
		const fieldPath = issue.path.join(".");

		if (issue.code === "invalid_type") {
			const pathKey = typeof issue.path[0] === "string" ? issue.path[0] : String(issue.path[0]);
			const actualType = data && typeof data === "object" && data !== null && pathKey in data ? typeof (data as Record<string, unknown>)[pathKey] : "unknown";
			typeMismatches.push({
				field: fieldPath,
				expected: issue.expected,
				actual: actualType,
			});
		} else if (issue.code === "unrecognized_keys") {
			extraFields.push(...issue.keys);
		} else if (issue.code === "invalid_union") {
			const pathKey = typeof issue.path[0] === "string" ? issue.path[0] : String(issue.path[0]);
			const actualType = data && typeof data === "object" && data !== null && pathKey in data ? typeof (data as Record<string, unknown>)[pathKey] : "unknown";
			typeMismatches.push({
				field: fieldPath,
				expected: "union type",
				actual: actualType,
			});
		}
	});

	// Check for missing required fields by comparing with sample data
	if (data && typeof data === "object" && data !== null) {
		const dataObj = data as Record<string, unknown>;
		const sampleItem = Array.isArray(dataObj.data)
			? dataObj.data[0]
			: Array.isArray(dataObj.data_points)
			? dataObj.data_points[0]
			: Array.isArray(dataObj.features)
			? dataObj.features[0]
			: Array.isArray(dataObj.routes)
			? dataObj.routes[0]
			: Array.isArray(dataObj.categories)
			? dataObj.categories[0]
			: dataObj;

		if (sampleItem && typeof sampleItem === "object" && sampleItem !== null) {
			// This is a simplified check - in a real implementation, you'd want to
			// recursively check the schema structure
			const expectedFields = ["id", "name", "latitude", "longitude"];
			expectedFields.forEach((field) => {
				if (!(field in sampleItem)) {
					missingFields.push(field);
				}
			});
		}
	}

	return {
		missingFields,
		extraFields,
		typeMismatches,
	};
}

export async function runAllHealthChecks(): Promise<HealthCheckResult[]> {
	console.log(`Running health checks for ${ENDPOINT_CONFIGS.length} endpoints...`);

	const results = await Promise.allSettled(ENDPOINT_CONFIGS.map((config) => testEndpoint(config)));

	return results.map((result, index) => {
		if (result.status === "fulfilled") {
			return result.value;
		} else {
			return {
				endpoint: ENDPOINT_CONFIGS[index].endpoint,
				name: ENDPOINT_CONFIGS[index].name,
				description: ENDPOINT_CONFIGS[index].description,
				status: "error" as const,
				responseTime: 0,
				schemaValidation: { isValid: false },
				error: result.reason?.message || "Unknown error",
			};
		}
	});
}
