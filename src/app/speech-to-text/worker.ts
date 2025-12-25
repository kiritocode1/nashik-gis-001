import { pipeline, env } from "@huggingface/transformers";
import type { ProgressInfo, AutomaticSpeechRecognitionPipeline } from "@huggingface/transformers";

env.allowLocalModels = false;

interface ConversationMessage {
	role: "user" | "assistant";
	content: string;
}

interface WorkerMessage {
	type: "init" | "converse";
	audio?: Float32Array;
	sampleRate?: number;
	conversationHistory?: ConversationMessage[];
	text?: string;
}

interface WorkerResponse {
	status: "initiate" | "ready" | "complete" | "error";
	transcription?: string;
	response?: string;
	error?: string;
	progress?: number;
}

interface MapDataPoint {
	id: number;
	category_id: number;
	subcategory_id: number;
	category_name: string;
	latitude: string;
	longitude: string;
	address: string;
	status: string;
	created_at: string;
	verified_at?: string | null;
	verified_by?: string | number | null;
}

interface MapDataResponse {
	success: boolean;
	data_points: MapDataPoint[];
}

interface Dial112Call {
	id: string;
	eventId: string;
	policeStation: string;
	callType: string;
	latitude: number;
	longitude: number;
	receivedAt: string;
}

interface Dial112Response {
	success: boolean;
	data: Dial112Call[];
}

interface CrimeAnalysis {
	totalCrimes: number;
	crimesByCategory: Record<string, number>;
	recentCrimes: number;
	topCategories: Array<{ name: string; count: number }>;
	totalEmergencyCalls: number;
	callsByType: Record<string, number>;
	callsByPoliceStation: Record<string, number>;
	insights: string[];
}

interface ComprehensiveData {
	crimeData: {
		total: number;
		recent: number;
		byCategory: Record<string, number>;
		topCategories: Array<{ name: string; count: number }>;
	};
	dial112: {
		total: number;
		byType: Record<string, number>;
		byPoliceStation: Record<string, number>;
		summary: string;
	};
	cctv: {
		total: number;
		working: number;
		byType: Record<string, number>;
		summary: string;
	};
	policeStations: {
		total: number;
		active: number;
		summary: string;
	};
	hospitals: {
		total: number;
		active: number;
		summary: string;
	};
	accidents: {
		total: number;
		summary: string;
	};
	processionRoutes: {
		total: number;
		summary: string;
	};
}

class VoxtralSingleton {
	static sttModel = "Xenova/whisper-base";
	static sttPipeline: AutomaticSpeechRecognitionPipeline | null = null;
	static isInitialized = false;
	static cachedAnalysis: CrimeAnalysis | null = null;
	static cachedComprehensiveData: ComprehensiveData | null = null;
	static lastFetchTime: number = 0;
	static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
	static readonly GEMINI_API_KEY = "AIzaSyAD1kW5t66raoxG684yIRcGE72avs9TX7A";

	static async callGemini(prompt: string): Promise<string> {
		try {
			const response = await fetch(
				`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.GEMINI_API_KEY}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						contents: [{ parts: [{ text: prompt }] }],
					}),
				}
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(`Gemini API Error: ${response.status} - ${JSON.stringify(errorData)}`);
			}

			const result = await response.json();
			return result.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, but I couldn't generate a response.";
		} catch (error) {
			console.error("Gemini API call failed:", error);
			return "I apologize, but I am having trouble connecting to the AI service right now. Please try again later.";
		}
	}

	static async fetchComprehensiveData(): Promise<ComprehensiveData> {
		const now = Date.now();
		if (this.cachedComprehensiveData && now - this.lastFetchTime < this.CACHE_DURATION) {
			return this.cachedComprehensiveData;
		}

		const BASE_URL = "https://rhtechnology.in/nashik-gis/app.php";
		const data: ComprehensiveData = {
			crimeData: { total: 0, recent: 0, byCategory: {}, topCategories: [] },
			dial112: { total: 0, byType: {}, byPoliceStation: {}, summary: "" },
			cctv: { total: 0, working: 0, byType: {}, summary: "" },
			policeStations: { total: 0, active: 0, summary: "" },
			hospitals: { total: 0, active: 0, summary: "" },
			accidents: { total: 0, summary: "" },
			processionRoutes: { total: 0, summary: "" },
		};

		// Fetch crime data
		try {
			console.log("🔍 Fetching crime data from get-map-data endpoint...");
			const mapResponse = await fetch(`${BASE_URL}?endpoint=get-map-data&limit=2000`, {
				method: "GET",
				headers: { Accept: "application/json" },
			});
			if (mapResponse.ok) {
				const mapData: MapDataResponse = await mapResponse.json();
				console.log("📊 Crime data response:", {
					success: mapData.success,
					totalPoints: mapData.data_points?.length || 0,
					samplePoint: mapData.data_points?.[0] || null,
				});
				if (mapData.success && mapData.data_points) {
					data.crimeData.total = mapData.data_points.length;
					const categoryCounts: Record<string, number> = {};
					const statusCounts: Record<string, number> = {};
					const verifiedCount = { verified: 0, unverified: 0 };
					const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
					const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

					for (const point of mapData.data_points) {
						const categoryName = point.category_name || "Unknown";
						categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;

						const status = point.status || "Unknown";
						statusCounts[status] = (statusCounts[status] || 0) + 1;

						if (point.verified_at) {
							verifiedCount.verified++;
						} else {
							verifiedCount.unverified++;
						}

						const createdAt = new Date(point.created_at).getTime();
						if (createdAt >= sevenDaysAgo) {
							data.crimeData.recent++;
						}
					}

					data.crimeData.byCategory = categoryCounts;
					data.crimeData.topCategories = Object.entries(categoryCounts)
						.sort(([, a], [, b]) => b - a)
						.slice(0, 10)
						.map(([name, count]) => ({ name, count }));

					console.log("✅ Crime data analysis:", {
						total: data.crimeData.total,
						recent: data.crimeData.recent,
						topCategories: data.crimeData.topCategories.slice(0, 5),
						verified: verifiedCount.verified,
						unverified: verifiedCount.unverified,
					});
				}
			} else {
				console.warn("⚠️ Crime data fetch failed:", mapResponse.status, mapResponse.statusText);
			}
		} catch (error) {
			console.error("❌ Error fetching crime data:", error);
		}

		// Fetch Dial 112 calls
		try {
			console.log("🔍 Fetching Dial 112 emergency calls...");
			const dial112Response = await fetch("/api/dial112", {
				method: "GET",
				headers: { Accept: "application/json" },
			});
			if (dial112Response.ok) {
				const dial112Data: Dial112Response = await dial112Response.json();
				console.log("📊 Dial 112 response:", {
					success: dial112Data.success,
					totalCalls: dial112Data.data?.length || 0,
					sampleCall: dial112Data.data?.[0] || null,
				});
				if (dial112Data.success && dial112Data.data) {
					data.dial112.total = dial112Data.data.length;
					const callTypeCounts: Record<string, number> = {};
					const stationCounts: Record<string, number> = {};
					const recentCalls = { last24h: 0, last7d: 0 };
					const now = Date.now();
					const oneDayAgo = now - 24 * 60 * 60 * 1000;
					const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

					for (const call of dial112Data.data) {
						const callType = call.callType || "Unknown";
						const station = call.policeStation || "Unknown";
						callTypeCounts[callType] = (callTypeCounts[callType] || 0) + 1;
						stationCounts[station] = (stationCounts[station] || 0) + 1;

						const receivedAt = new Date(call.receivedAt).getTime();
						if (receivedAt >= oneDayAgo) recentCalls.last24h++;
						if (receivedAt >= sevenDaysAgo) recentCalls.last7d++;
					}

					data.dial112.byType = callTypeCounts;
					data.dial112.byPoliceStation = stationCounts;

					const topCallType = Object.entries(callTypeCounts).sort(([, a], [, b]) => b - a)[0];
					const topStation = Object.entries(stationCounts).sort(([, a], [, b]) => b - a)[0];
					data.dial112.summary = `Total: ${data.dial112.total} calls. Recent: ${recentCalls.last24h} (24h), ${recentCalls.last7d} (7d). Top type: ${topCallType?.[0] || "N/A"} (${topCallType?.[1] || 0
						}). Top station: ${topStation?.[0] || "N/A"} (${topStation?.[1] || 0} calls).`;

					console.log("✅ Dial 112 analysis:", {
						total: data.dial112.total,
						recent24h: recentCalls.last24h,
						recent7d: recentCalls.last7d,
						topCallTypes: Object.entries(callTypeCounts)
							.sort(([, a], [, b]) => b - a)
							.slice(0, 5),
						topStations: Object.entries(stationCounts)
							.sort(([, a], [, b]) => b - a)
							.slice(0, 5),
					});
				}
			} else {
				console.warn("⚠️ Dial 112 fetch failed:", dial112Response.status, dial112Response.statusText);
			}
		} catch (error) {
			console.error("❌ Error fetching dial 112 data:", error);
		}

		// Fetch CCTV locations
		try {
			console.log("🔍 Fetching CCTV locations...");
			const cctvResponse = await fetch(`${BASE_URL}?endpoint=get-cctv-locations`, {
				method: "GET",
				headers: { Accept: "application/json" },
			});
			if (cctvResponse.ok) {
				const cctvData = await cctvResponse.json();
				console.log("📊 CCTV response:", {
					success: cctvData.success,
					totalCameras: cctvData.data?.length || 0,
					sampleCamera: cctvData.data?.[0] || null,
				});
				if (cctvData.success && cctvData.data) {
					data.cctv.total = cctvData.data.length;
					const typeCounts: Record<string, number> = {};
					const wardCounts: Record<string, number> = {};
					let workingCount = 0;

					for (const cctv of cctvData.data) {
						const type = cctv.camera_type || cctv.type || "Unknown";
						const ward = cctv.ward || "Unknown";
						typeCounts[type] = (typeCounts[type] || 0) + 1;
						wardCounts[ward] = (wardCounts[ward] || 0) + 1;

						if (cctv.is_working === true || cctv.is_working === "true" || cctv.is_working === 1) {
							workingCount++;
						}
					}

					data.cctv.working = workingCount;
					data.cctv.byType = typeCounts;
					const workingPercent = data.cctv.total > 0 ? Math.round((workingCount / data.cctv.total) * 100) : 0;
					const topWard = Object.entries(wardCounts).sort(([, a], [, b]) => b - a)[0];
					data.cctv.summary = `Total: ${data.cctv.total} cameras. Working: ${workingCount} (${workingPercent}%). Top ward: ${topWard?.[0] || "N/A"} (${topWard?.[1] || 0} cameras).`;

					console.log("✅ CCTV analysis:", {
						total: data.cctv.total,
						working: workingCount,
						workingPercent,
						topTypes: Object.entries(typeCounts)
							.sort(([, a], [, b]) => b - a)
							.slice(0, 5),
						topWards: Object.entries(wardCounts)
							.sort(([, a], [, b]) => b - a)
							.slice(0, 5),
					});
				}
			} else {
				console.warn("⚠️ CCTV fetch failed:", cctvResponse.status, cctvResponse.statusText);
			}
		} catch (error) {
			console.error("❌ Error fetching CCTV data:", error);
		}

		// Fetch Police Stations
		try {
			console.log("🔍 Fetching police stations...");
			const policeResponse = await fetch(`${BASE_URL}?endpoint=get-police-stations`, {
				method: "GET",
				headers: { Accept: "application/json" },
			});
			if (policeResponse.ok) {
				const policeData = await policeResponse.json();
				console.log("📊 Police stations response:", {
					hasData: !!policeData.data,
					hasItems: !!policeData.items,
					hasStations: !!policeData.stations,
					sample: policeData.data?.[0] || policeData.items?.[0] || policeData.stations?.[0] || null,
				});
				const stations = Array.isArray(policeData.data) ? policeData.data : Array.isArray(policeData.items) ? policeData.items : Array.isArray(policeData.stations) ? policeData.stations : [];
				data.policeStations.total = stations.length;
				const activeStations = stations.filter((s: { is_active?: boolean | string | number }) => {
					const active = s.is_active;
					return active === true || active === "true" || active === 1 || active === "1";
				});
				data.policeStations.active = activeStations.length;

				const typeCounts: Record<string, number> = {};
				const wardCounts: Record<string, number> = {};
				for (const station of stations) {
					const type = (station as { type?: string }).type || "Unknown";
					const ward = (station as { ward?: string }).ward || "Unknown";
					typeCounts[type] = (typeCounts[type] || 0) + 1;
					wardCounts[ward] = (wardCounts[ward] || 0) + 1;
				}

				const topType = Object.entries(typeCounts).sort(([, a], [, b]) => b - a)[0];
				data.policeStations.summary = `Total: ${data.policeStations.total} stations. Active: ${data.policeStations.active} (${Math.round(
					(data.policeStations.active / data.policeStations.total) * 100,
				)}%). Top type: ${topType?.[0] || "N/A"} (${topType?.[1] || 0}).`;

				console.log("✅ Police stations analysis:", {
					total: data.policeStations.total,
					active: data.policeStations.active,
					types: Object.entries(typeCounts)
						.sort(([, a], [, b]) => b - a)
						.slice(0, 5),
				});
			} else {
				console.warn("⚠️ Police stations fetch failed:", policeResponse.status, policeResponse.statusText);
			}
		} catch (error) {
			console.error("❌ Error fetching police stations:", error);
		}

		// Fetch Hospitals
		try {
			console.log("🔍 Fetching hospitals...");
			const hospitalResponse = await fetch(`${BASE_URL}?endpoint=get-hospitals`, {
				method: "GET",
				headers: { Accept: "application/json" },
			});
			if (hospitalResponse.ok) {
				const hospitalData = await hospitalResponse.json();
				console.log("📊 Hospitals response:", {
					success: hospitalData.success,
					totalHospitals: hospitalData.data?.length || 0,
					sampleHospital: hospitalData.data?.[0] || null,
				});
				if (hospitalData.success && hospitalData.data) {
					data.hospitals.total = hospitalData.data.length;
					const activeHospitals = hospitalData.data.filter((h: { is_active?: boolean | string | number }) => {
						const active = h.is_active;
						return active === true || active === "true" || active === 1 || active === "1";
					});
					data.hospitals.active = activeHospitals.length;

					const typeCounts: Record<string, number> = {};
					const wardCounts: Record<string, number> = {};
					for (const hospital of hospitalData.data) {
						const type = (hospital as { type?: string }).type || "Unknown";
						const ward = (hospital as { ward?: string }).ward || "Unknown";
						typeCounts[type] = (typeCounts[type] || 0) + 1;
						wardCounts[ward] = (wardCounts[ward] || 0) + 1;
					}

					const topType = Object.entries(typeCounts).sort(([, a], [, b]) => b - a)[0];
					data.hospitals.summary = `Total: ${data.hospitals.total} hospitals. Active: ${data.hospitals.active} (${Math.round(
						(data.hospitals.active / data.hospitals.total) * 100,
					)}%). Top type: ${topType?.[0] || "N/A"} (${topType?.[1] || 0}).`;

					console.log("✅ Hospitals analysis:", {
						total: data.hospitals.total,
						active: data.hospitals.active,
						types: Object.entries(typeCounts)
							.sort(([, a], [, b]) => b - a)
							.slice(0, 5),
					});
				}
			} else {
				console.warn("⚠️ Hospitals fetch failed:", hospitalResponse.status, hospitalResponse.statusText);
			}
		} catch (error) {
			console.error("❌ Error fetching hospitals:", error);
		}

		// Fetch Procession Routes
		try {
			console.log("🔍 Fetching procession routes...");
			const routeResponse = await fetch(`${BASE_URL}?endpoint=get-procession-routes`, {
				method: "GET",
				headers: { Accept: "application/json" },
			});
			if (routeResponse.ok) {
				const routeData = await routeResponse.json();
				console.log("📊 Procession routes response:", {
					success: routeData.success,
					totalRoutes: routeData.routes?.length || 0,
					sampleRoute: routeData.routes?.[0] || null,
				});
				if (routeData.success && routeData.routes) {
					data.processionRoutes.total = routeData.routes.length;

					const festivalCounts: Record<string, number> = {};
					const stationCounts: Record<string, number> = {};
					let verifiedRoutes = 0;

					for (const route of routeData.routes) {
						const festival = (route as { festival_name?: string }).festival_name || "Unknown";
						const station = (route as { police_station?: string }).police_station || "Unknown";
						festivalCounts[festival] = (festivalCounts[festival] || 0) + 1;
						stationCounts[station] = (stationCounts[station] || 0) + 1;

						if ((route as { verified_at?: string | null }).verified_at) {
							verifiedRoutes++;
						}
					}

					const topFestival = Object.entries(festivalCounts).sort(([, a], [, b]) => b - a)[0];
					data.processionRoutes.summary = `Total: ${data.processionRoutes.total} routes. Verified: ${verifiedRoutes}. Top festival: ${topFestival?.[0] || "N/A"} (${topFestival?.[1] || 0
						} routes).`;

					console.log("✅ Procession routes analysis:", {
						total: data.processionRoutes.total,
						verified: verifiedRoutes,
						topFestivals: Object.entries(festivalCounts)
							.sort(([, a], [, b]) => b - a)
							.slice(0, 5),
					});
				}
			} else {
				console.warn("⚠️ Procession routes fetch failed:", routeResponse.status, routeResponse.statusText);
			}
		} catch (error) {
			console.error("❌ Error fetching procession routes:", error);
		}

		console.log("📋 Comprehensive data summary:", {
			crimeData: { total: data.crimeData.total, recent: data.crimeData.recent },
			dial112: { total: data.dial112.total },
			cctv: { total: data.cctv.total, working: data.cctv.working },
			policeStations: { total: data.policeStations.total, active: data.policeStations.active },
			hospitals: { total: data.hospitals.total, active: data.hospitals.active },
			processionRoutes: { total: data.processionRoutes.total },
		});

		this.cachedComprehensiveData = data;
		this.lastFetchTime = now;
		return data;
	}

	static async initialize(progressCallback?: (progressInfo: ProgressInfo) => void): Promise<void> {
		if (this.isInitialized) return;

		try {
			const progress = (info: ProgressInfo) => {
				if (progressCallback) {
					progressCallback(info);
				}
				const progressValue = typeof info === "object" && "progress" in info ? (info.progress as number) : 0;
				self.postMessage({
					status: "initiate",
					progress: progressValue,
				} as WorkerResponse);
			};

			self.postMessage({
				status: "initiate",
				progress: 0.1,
			} as WorkerResponse);

			const sttResult = await pipeline("automatic-speech-recognition", this.sttModel, {
				progress_callback: progress,
			});
			this.sttPipeline = sttResult as AutomaticSpeechRecognitionPipeline;

			this.isInitialized = true;
			self.postMessage({
				status: "ready",
			} as WorkerResponse);
		} catch (error) {
			self.postMessage({
				status: "error",
				error: error instanceof Error ? error.message : "Failed to initialize models",
			} as WorkerResponse);
			throw error;
		}
	}

	static async converseText(text: string, conversationHistory: ConversationMessage[]): Promise<{ response: string }> {
		// Fetch comprehensive data
		let comprehensiveData = "";
		try {
			const data = await this.fetchComprehensiveData();

			// Fetch detailed crime data for geographic analysis
			let geographicAnalysis = "";
			let temporalAnalysis = "";
			try {
				const BASE_URL = "https://rhtechnology.in/nashik-gis/app.php";
				const mapResponse = await fetch(`${BASE_URL}?endpoint=get-map-data&limit=2000`, {
					method: "GET",
					headers: { Accept: "application/json" },
				});
				if (mapResponse.ok) {
					const mapData: MapDataResponse = await mapResponse.json();
					if (mapData.success && mapData.data_points) {
						// Geographic analysis
						const wardCounts: Record<string, number> = {};
						const addressPatterns: Record<string, number> = {};
						const categoryByWard: Record<string, Record<string, number>> = {};

						for (const point of mapData.data_points) {
							const address = point.address || "";
							const wardMatch = address.match(/ward\s*(\d+)|ward\s*([A-Za-z]+)/i);
							const ward = wardMatch ? wardMatch[1] || wardMatch[2] : "Unknown";
							wardCounts[ward] = (wardCounts[ward] || 0) + 1;

							const addressWords = address.split(/\s+/).slice(0, 3).join(" ");
							if (addressWords) {
								addressPatterns[addressWords] = (addressPatterns[addressWords] || 0) + 1;
							}

							if (!categoryByWard[ward]) {
								categoryByWard[ward] = {};
							}
							const catName = point.category_name || "Unknown";
							categoryByWard[ward][catName] = (categoryByWard[ward][catName] || 0) + 1;
						}

						const topWards = Object.entries(wardCounts)
							.sort(([, a], [, b]) => b - a)
							.slice(0, 5);
						const topAddresses = Object.entries(addressPatterns)
							.sort(([, a], [, b]) => b - a)
							.slice(0, 5);

						geographicAnalysis = `\nGEOGRAPHIC ANALYSIS:\n`;
						geographicAnalysis += `- Top 5 Wards by Crime Count:\n`;
						topWards.forEach(([ward, count], idx) => {
							const percent = Math.round((count / data.crimeData.total) * 100);
							geographicAnalysis += `  ${idx + 1}. Ward ${ward}: ${count} incidents (${percent}% of total)\n`;
							const topCatInWard = Object.entries(categoryByWard[ward] || {}).sort(([, a], [, b]) => b - a)[0];
							if (topCatInWard) {
								geographicAnalysis += `     Most common: ${topCatInWard[0]} (${topCatInWard[1]} incidents)\n`;
							}
						});
						geographicAnalysis += `- Top Crime-Prone Areas:\n`;
						topAddresses.forEach(([area, count], idx) => {
							geographicAnalysis += `  ${idx + 1}. ${area}: ${count} incidents\n`;
						});

						// Temporal analysis
						const hourCounts: Record<number, number> = {};
						const dayOfWeekCounts: Record<number, number> = {};

						for (const point of mapData.data_points) {
							const date = new Date(point.created_at);
							const hour = date.getHours();
							const dayOfWeek = date.getDay();

							hourCounts[hour] = (hourCounts[hour] || 0) + 1;
							dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1;
						}

						const topHours = Object.entries(hourCounts)
							.sort(([, a], [, b]) => b - a)
							.slice(0, 3)
							.map(([h]) => parseInt(h));
						const topDays = Object.entries(dayOfWeekCounts)
							.sort(([, a], [, b]) => b - a)
							.slice(0, 2)
							.map(([d]) => parseInt(d));

						const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

						temporalAnalysis = `\nTEMPORAL PATTERNS:\n`;
						temporalAnalysis += `- Peak Crime Hours: ${topHours.map((h) => `${h}:00`).join(", ")}\n`;
						temporalAnalysis += `- Most Active Days: ${topDays.map((d) => dayNames[d]).join(", ")}\n`;
						temporalAnalysis += `- Recent Activity: ${data.crimeData.recent} crimes in last 7 days (${Math.round((data.crimeData.recent / data.crimeData.total) * 100)}% of total)\n`;
					}
				}
			} catch (error) {
				console.error("Error in detailed analysis:", error);
			}

			comprehensiveData = `\n\n=== COMPREHENSIVE NASHIK CRIME & EMERGENCY DATA REPORT ===\n\n`;

			// Crime Data Summary with Analysis
			comprehensiveData += `CRIME INCIDENTS ANALYSIS:\n`;
			comprehensiveData += `- Total Incidents: ${data.crimeData.total}\n`;
			comprehensiveData += `- Recent (Last 7 Days): ${data.crimeData.recent} (${Math.round((data.crimeData.recent / data.crimeData.total) * 100)}% of total)\n`;
			if (data.crimeData.topCategories.length > 0) {
				comprehensiveData += `- Top Crime Categories:\n`;
				data.crimeData.topCategories.slice(0, 5).forEach((cat, idx) => {
					const percent = Math.round((cat.count / data.crimeData.total) * 100);
					comprehensiveData += `  ${idx + 1}. ${cat.name}: ${cat.count} incidents (${percent}%)\n`;
				});
			}
			comprehensiveData += geographicAnalysis;
			comprehensiveData += temporalAnalysis;

			// Dial 112 Summary with Analysis
			comprehensiveData += `\n\nDIAL 112 EMERGENCY CALLS ANALYSIS:\n`;
			comprehensiveData += `- Total Calls: ${data.dial112.total}\n`;
			if (Object.keys(data.dial112.byType).length > 0) {
				const topCallTypes = Object.entries(data.dial112.byType)
					.sort(([, a], [, b]) => b - a)
					.slice(0, 5);
				comprehensiveData += `- Emergency Call Type Distribution:\n`;
				topCallTypes.forEach(([type, count], idx) => {
					const percent = Math.round((count / data.dial112.total) * 100);
					comprehensiveData += `  ${idx + 1}. ${type}: ${count} calls (${percent}%)\n`;
				});
			}
			if (Object.keys(data.dial112.byPoliceStation).length > 0) {
				const topStations = Object.entries(data.dial112.byPoliceStation)
					.sort(([, a], [, b]) => b - a)
					.slice(0, 5);
				comprehensiveData += `- Stations with Highest Call Volume:\n`;
				topStations.forEach(([station, count], idx) => {
					const percent = Math.round((count / data.dial112.total) * 100);
					comprehensiveData += `  ${idx + 1}. ${station}: ${count} calls (${percent}%)\n`;
				});
			}
			comprehensiveData += `- Key Insights: ${data.dial112.summary}\n`;

			// Dial 112 pattern analysis
			if (data.dial112.total > 0) {
				const dominantCallType = Object.entries(data.dial112.byType).sort(([, a], [, b]) => b - a)[0];
				if (dominantCallType && dominantCallType[1] > data.dial112.total * 0.3) {
					const percent = Math.round((dominantCallType[1] / data.dial112.total) * 100);
					comprehensiveData += `- Pattern Alert: ${dominantCallType[0]} accounts for ${percent}% of all emergency calls. This suggests a need for specialized response protocols.\n`;
				}
			}

			// CCTV Summary with Analysis
			comprehensiveData += `\n\nCCTV SURVEILLANCE ANALYSIS:\n`;
			comprehensiveData += `- Total Cameras: ${data.cctv.total}\n`;
			comprehensiveData += `- Operational Status: ${data.cctv.working} working, ${data.cctv.total - data.cctv.working} non-functional\n`;
			const workingPercent = data.cctv.total > 0 ? Math.round((data.cctv.working / data.cctv.total) * 100) : 0;
			comprehensiveData += `- Operational Rate: ${workingPercent}%\n`;
			if (Object.keys(data.cctv.byType).length > 0) {
				const topTypes = Object.entries(data.cctv.byType)
					.sort(([, a], [, b]) => b - a)
					.slice(0, 3);
				comprehensiveData += `- Camera Type Distribution:\n`;
				topTypes.forEach(([type, count], idx) => {
					const percent = Math.round((count / data.cctv.total) * 100);
					comprehensiveData += `  ${idx + 1}. ${type}: ${count} cameras (${percent}%)\n`;
				});
			}
			comprehensiveData += `- Summary: ${data.cctv.summary}\n`;
			if (workingPercent < 80) {
				comprehensiveData += `- Critical Alert: ${100 - workingPercent}% of cameras are non-functional. Immediate maintenance required for effective surveillance.\n`;
			}

			// Police Stations Summary with Analysis
			comprehensiveData += `\n\nPOLICE STATIONS ANALYSIS:\n`;
			comprehensiveData += `- ${data.policeStations.summary}\n`;
			if (data.policeStations.total > 0) {
				const inactiveCount = data.policeStations.total - data.policeStations.active;
				if (inactiveCount > 0) {
					comprehensiveData += `- Alert: ${inactiveCount} stations are inactive. Review operational status.\n`;
				}
				const coverageRatio = data.crimeData.total > 0 ? (data.crimeData.total / data.policeStations.active).toFixed(1) : "N/A";
				comprehensiveData += `- Resource Analysis: ${coverageRatio} crimes per active station (indicates workload distribution)\n`;
			}

			// Hospitals Summary with Analysis
			comprehensiveData += `\n\nHOSPITALS ANALYSIS:\n`;
			comprehensiveData += `- ${data.hospitals.summary}\n`;
			if (data.hospitals.total > 0) {
				const inactiveCount = data.hospitals.total - data.hospitals.active;
				if (inactiveCount > 0) {
					comprehensiveData += `- Alert: ${inactiveCount} hospitals are inactive. May impact emergency medical response.\n`;
				}
				const hospitalToPopulationRatio = data.hospitals.active > 0 ? (data.dial112.total / data.hospitals.active).toFixed(1) : "N/A";
				comprehensiveData += `- Emergency Response Capacity: ${hospitalToPopulationRatio} emergency calls per active hospital\n`;
			}

			// Procession Routes Summary with Analysis
			comprehensiveData += `\n\nPROCESSION ROUTES ANALYSIS:\n`;
			comprehensiveData += `- ${data.processionRoutes.summary}\n`;
			if (data.processionRoutes.total > 0) {
				comprehensiveData += `- Security Planning: ${data.processionRoutes.total} routes require police coordination and crowd management.\n`;
				comprehensiveData += `- Recommendation: Coordinate with top stations from Dial 112 analysis for route security.\n`;
			}

			// Forecasting Alerts
			comprehensiveData += `\n=== FORECASTING INSIGHTS ===\n`;
			if (data.crimeData.recent > 0 && data.crimeData.total > 0) {
				const recentPercent = Math.round((data.crimeData.recent / data.crimeData.total) * 100);
				if (recentPercent > 30) {
					comprehensiveData += `⚠️ High recent activity: ${recentPercent}% of crimes in last 7 days. Consider increased patrols.\n`;
				}
			}
			if (data.crimeData.topCategories.length > 0) {
				const dominant = data.crimeData.topCategories[0];
				const percent = Math.round((dominant.count / data.crimeData.total) * 100);
				if (percent > 30) {
					comprehensiveData += `⚠️ Dominant crime type: ${dominant.name} (${percent}% of total). Focus prevention efforts here.\n`;
				}
			}
			if (data.dial112.total > 0) {
				const topCallType = Object.entries(data.dial112.byType).sort(([, a], [, b]) => b - a)[0];
				if (topCallType) {
					const percent = Math.round((topCallType[1] / data.dial112.total) * 100);
					comprehensiveData += `⚠️ Most frequent emergency: ${topCallType[0]} (${percent}% of calls). Prepare response protocols.\n`;
				}
			}
			if (data.cctv.total > 0) {
				const workingPercent = Math.round((data.cctv.working / data.cctv.total) * 100);
				if (workingPercent < 80) {
					comprehensiveData += `⚠️ CCTV maintenance needed: Only ${workingPercent}% cameras operational.\n`;
				}
			}
		} catch (error) {
			console.error("Error fetching comprehensive data:", error);
			comprehensiveData = "\n\nNote: Real-time data temporarily unavailable. Using general knowledge.\n";
		}

		const systemPrompt = `You are a data analyst for Nashik Government. You ONLY report statistics and patterns from the data provided below.

STRICT RULES - FOLLOW EXACTLY:
1. NEVER explain what Dial 112, CCTV, or other systems are or how they work. Users already know.
2. NEVER use general knowledge, Wikipedia information, or facts not in the data below.
3. ALWAYS start with specific numbers and statistics from the data.
4. ONLY report: totals, counts, percentages, top categories, patterns, trends from the data.
5. If data isn't available, say "Data not available" - do NOT make up anything.

RESPONSE FORMAT:
- Start immediately with key statistics
- List top categories/types with counts
- Mention percentages and patterns
- Keep it concise - no explanations

BAD EXAMPLE (DO NOT DO THIS):
"Dial 112 is an emergency system used in North America. It allows rapid deployment..."

GOOD EXAMPLE (DO THIS):
"Dial 112 data shows: Total calls: 1,234. Top call type: Medical Emergency (456 calls, 37%). Top station: Station A (234 calls). Recent activity: 89 calls in last 24 hours."

Below is the Nashik data. Use ONLY these numbers:${comprehensiveData}`;

		const conversationText = conversationHistory.map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`).join("\n");

		const prompt = conversationText ? `${systemPrompt}\n\n${conversationText}\nUser: ${text}\nAssistant:` : `${systemPrompt}\n\nUser: ${text}\nAssistant:`;

		const response = await this.callGemini(prompt);
		return { response };
	}

	static async converse(audio: Float32Array, sampleRate: number, conversationHistory: ConversationMessage[]): Promise<{ transcription: string; response: string }> {
		if (!this.sttPipeline) {
			throw new Error("Model not initialized");
		}

		const sttResult = await this.sttPipeline(audio, {
			return_timestamps: false,
		});
		const transcription = (sttResult as { text: string }).text;

		// Re-use converseText logic, just call it
		const { response } = await this.converseText(transcription, conversationHistory);
		return { transcription, response };
	}
}

self.addEventListener("message", async (event: MessageEvent<WorkerMessage>) => {
	try {
		if (event.data.type === "init") {
			const timeout = setTimeout(() => {
				self.postMessage({
					status: "error",
					error: "Model loading timeout. Please refresh the page.",
				} as WorkerResponse);
			}, 300000);

			try {
				await VoxtralSingleton.initialize((progressInfo) => {
					const progress = typeof progressInfo === "object" && "progress" in progressInfo ? (progressInfo.progress as number) : 0;
					self.postMessage({
						status: "initiate",
						progress,
					} as WorkerResponse);
				});
				clearTimeout(timeout);
			} catch (error) {
				clearTimeout(timeout);
				throw error;
			}
		} else if (event.data.type === "converse") {
			if (event.data.text && event.data.conversationHistory !== undefined) {
				// Text-only conversation
				const result = await VoxtralSingleton.converseText(event.data.text, event.data.conversationHistory || []);

				self.postMessage({
					status: "complete",
					response: result.response,
				} as WorkerResponse);
			} else if (event.data.audio && event.data.sampleRate && event.data.conversationHistory !== undefined) {
				// Audio conversation
				const result = await VoxtralSingleton.converse(event.data.audio, event.data.sampleRate, event.data.conversationHistory || []);

				self.postMessage({
					status: "complete",
					transcription: result.transcription,
					response: result.response,
				} as WorkerResponse);
			} else {
				throw new Error("Missing required data for conversation");
			}
		}
	} catch (error) {
		self.postMessage({
			status: "error",
			error: error instanceof Error ? error.message : "Unknown error",
		} as WorkerResponse);
	}
});
