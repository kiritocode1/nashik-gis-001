import { NextResponse } from "next/server";
import fs from "fs";
import readline from "readline";

export const maxDuration = 60;

export async function GET() {
	const csvPath = process.cwd() + "/emergency-data/accident_data.csv";

	// Check if file exists first
	if (!fs.existsSync(csvPath)) {
		console.error("❌ CSV file not found:", csvPath);
		return NextResponse.json({ success: false, error: "CSV file not found" }, { status: 404 });
	}

	console.log("🚗 Starting Accident Data SSE stream from:", csvPath);

	try {
		const encoder = new TextEncoder();
		let clientDisconnected = false;

		const stream = new ReadableStream({
			async start(controller) {
				try {
					console.log("📡 SSE connection established");
					// Send initial comment to establish stream
					controller.enqueue(encoder.encode(": stream start\n\n"));

					const fileStream = fs.createReadStream(csvPath, { encoding: "utf8" });
					const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

					let isHeader = true;
					let count = 0;
					for await (const line of rl) {
						// Check if client disconnected
						if (clientDisconnected) {
							console.log(`⚠️ Client disconnected, stopping at ${count} records`);
							fileStream.destroy();
							break;
						}

						if (!line || line.trim().length === 0) continue;
						if (isHeader) {
							isHeader = false;
							continue; // Skip first header line
						}

						// Skip second header line (duplicate)
						if (count === 0 && line.includes("S.No,State name")) {
							continue;
						}

						const parts = line.split(",");
						if (parts.length < 8) continue;

						// CSV format: Sr_No,State,District,Latitude,Longitude,Grid_ID,Accident_Count,All_India_Rank
						const lat = Number(parts[3]?.trim());
						const lng = Number(parts[4]?.trim());
						if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
							console.log(`⚠️ Invalid coordinates: lat=${parts[3]}, lng=${parts[4]}`);
							continue;
						}

						const payload = {
							srNo: String(parts[0]?.trim() || ""),
							state: String(parts[1]?.trim() || ""),
							district: String(parts[2]?.trim() || ""),
							latitude: lat,
							longitude: lng,
							gridId: String(parts[5]?.trim() || ""),
							accidentCount: Number(parts[6]?.trim()) || 0,
							allIndiaRank: Number(parts[7]?.trim()) || 0,
							ambulance: String(parts[8]?.trim() || ""),
						};

						try {
							const chunk = `event: row\ndata: ${JSON.stringify(payload)}\n\n`;
							controller.enqueue(encoder.encode(chunk));
							count++;
						} catch {
							// Client disconnected mid-stream
							console.log(`⚠️ Client disconnected at ${count} records`);
							clientDisconnected = true;
							fileStream.destroy();
							break;
						}
					}

					if (!clientDisconnected) {
						console.log(`✅ Streamed ${count} accident records`);
						controller.enqueue(encoder.encode(`event: done\ndata: end\n\n`));
						controller.close();
					}
				} catch (err) {
					console.error("❌ Stream error:", err);
					if (!clientDisconnected) {
						try {
							controller.error(err);
						} catch {
							// Controller already closed
						}
					}
				}
			},
			cancel() {
				clientDisconnected = true;
			},
		});

		return new Response(stream, {
			headers: {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
				"X-Accel-Buffering": "no", // Disable nginx buffering
			},
		});
	} catch (error) {
		console.error("❌ Failed to create accident data stream:", error);
		return NextResponse.json({ success: false, error: "Failed to create stream" }, { status: 500 });
	}
}
