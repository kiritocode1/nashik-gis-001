import { google } from "@ai-sdk/google";
import { streamText, convertToModelMessages, tool } from "ai";
import { z } from "zod";

export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();

    const result = streamText({
        model: google("gemini-2.5-flash-lite"),
        messages: await convertToModelMessages(messages),
        // @ts-ignore
        maxSteps: 5,
        // If maxSteps errors, we rely on the runtime.
        system: `You are a data analyst for Nashik Government. You help users understand city data including crime, emergency services, and infrastructure.

STRICT RULES:
1. NEVER explain what Dial 112, CCTV, or other systems are or how they work. Users already know.
2. NEVER use general knowledge, Wikipedia information, or facts not in the data context.
3. ALWAYS start with specific numbers and statistics when available.
4. ONLY report: totals, counts, percentages, top categories, patterns, trends from the data.
5. If data isn't available, check if you can use the 'get_city_data' tool. if still not available, say "Data not available".
6. Format with Markdown (bold, lists).`,
        tools: {
            get_city_data: tool({
                description: "Get real-time data about Nashik city including crime stats, emergency calls (Dial 112), CCTV locations, police stations, hospitals, and procession routes.",
                inputSchema: z.object({
                    category: z.enum(["all", "crime", "emergency", "infrastructure"]).describe("The category of data to fetch. Use 'all' for a general overview."),
                }),
                execute: async ({ category }) => {
                    return await fetchContextData(category);
                },
            }),
        },
    });

    return result.toUIMessageStreamResponse();
}

async function fetchContextData(category: string) {
    try {
        const BASE_URL = "https://rhtechnology.in/nashik-gis/app.php";

        // Helper to fetch JSON safely
        const fetchJson = async (url: string) => {
            try {
                const res = await fetch(url);
                return res.ok ? await res.json() : null;
            } catch (e) {
                console.error(`Failed to fetch ${url}`, e);
                return null;
            }
        };

        // Define fetch promises based on category
        const promises: Record<string, Promise<any>> = {};

        if (category === "all" || category === "crime") {
            promises.crime = fetchJson(`${BASE_URL}?endpoint=get-map-data&limit=2000`);
        }
        if (category === "all" || category === "emergency") {
            promises.dial112 = fetch("http://localhost:3000/api/dial112").then(r => r.ok ? r.json() : null).catch(() => null);
            promises.hospitals = fetchJson(`${BASE_URL}?endpoint=get-hospitals`);
        }
        if (category === "all" || category === "infrastructure") {
            promises.cctv = fetchJson(`${BASE_URL}?endpoint=get-cctv-locations`);
            promises.police = fetchJson(`${BASE_URL}?endpoint=get-police-stations`);
            promises.routes = fetchJson(`${BASE_URL}?endpoint=get-procession-routes`);
        }

        // Execute fetches
        const results: any = {};
        for (const [key, promise] of Object.entries(promises)) {
            results[key] = await promise;
        }

        let summary = "";

        // Process Crime Data
        if (results.crime?.success && results.crime?.data_points) {
            const points = results.crime.data_points;
            summary += `CRIME INCIDENTS (${points.length} records):\n`;
            const cats: Record<string, number> = {};
            points.forEach((p: any) => {
                const c = p.category_name || "Unknown";
                cats[c] = (cats[c] || 0) + 1;
            });
            const topCats = Object.entries(cats).sort(([, a], [, b]) => b - a).slice(0, 5);
            summary += `- Top Categories: ${topCats.map(([n, c]) => `${n} (${c})`).join(", ")}\n`;
        }

        // Process other data simply
        if (results.dial112) summary += `\nDIAL 112: ${JSON.stringify(results.dial112).slice(0, 200)}...\n`;
        if (results.cctv?.data) summary += `\nCCTV: ${results.cctv.data.length || 0} locations found.\n`;
        if (results.police?.data) summary += `\nPOLICE STATIONS: ${results.police.data.length || 0} stations found.\n`;
        if (results.hospitals?.data) summary += `\nHOSPITALS: ${results.hospitals.data.length || 0} hospitals found.\n`;

        return summary || "No data available checking endpoints.";
    } catch (error) {
        console.error("Context fetch error:", error);
        return "Error fetching real-time data.";
    }
}
