import { NextResponse } from "next/server";
import fs from "fs";
import readline from "readline";

export const maxDuration = 60;

interface Dial112Row {
	id: string;
	eventId: string;
	policeStation: string;
	callType: string;
	latitude: number;
	longitude: number;
	receivedAt: string;
}

export async function GET() {
	const csvPath = process.cwd() + "/emergency-data/dial112.csv";

	// Check if file exists first
	if (!fs.existsSync(csvPath)) {
		console.error("❌ CSV file not found:", csvPath);
		return NextResponse.json({ success: false, error: "CSV file not found" }, { status: 404 });
	}

	console.log("📞 Starting Dial112 Data SSE stream from:", csvPath);

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

						const parts = line.split(",");
						if (parts.length < 7) continue;

						// CSV format: #,Event_Id,Police_Station,Call_Type,Latitude,Longitude,Call_Recieved_Time
						const id = parts[0]?.trim() || "";
						const eventId = parts[1]?.trim() || "";
						const policeStation = parts[2]?.trim() || "";
						const callType = parts[3]?.trim() || "";
						const latStr = parts[4]?.trim();
						const lngStr = parts[5]?.trim();
						const receivedAt = parts.slice(6).join(",").trim();

						const latitude = Number(latStr);
						const longitude = Number(lngStr);
						if (!isFinite(latitude) || !isFinite(longitude)) {
							console.log(`⚠️ Invalid coordinates: lat=${latStr}, lng=${lngStr}`);
							continue;
						}

						const payload: Dial112Row = {
							id,
							eventId,
							policeStation,
							callType,
							latitude,
							longitude,
							receivedAt,
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
						console.log(`✅ Streamed ${count} dial112 records`);
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
		console.error("❌ Failed to create dial112 data stream:", error);
		return NextResponse.json({ success: false, error: "Failed to create stream" }, { status: 500 });
	}
}
