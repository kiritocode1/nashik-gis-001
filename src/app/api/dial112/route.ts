import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

interface Dial112Row {
	id: string;
	eventId: string;
	policeStation: string;
	callType: string;
	latitude: number;
	longitude: number;
	receivedAt: string;
}

function parseCsv(text: string): Dial112Row[] {
	const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
	if (lines.length <= 1) return [];
	// Header: #,Event_Id,Police_Station,Call_Type,Latitude,Longitude,Call_Recieved_Time
	const rows: Dial112Row[] = [];
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i];
		// simple CSV split (data appears clean without embedded commas or quotes)
		const parts = line.split(",");
		if (parts.length < 7) continue;
		const id = parts[0]?.trim();
		const eventId = parts[1]?.trim();
		const policeStation = parts[2]?.trim();
		const callType = parts[3]?.trim();
		const latStr = parts[4]?.trim();
		const lngStr = parts[5]?.trim();
		const receivedAt = parts.slice(6).join(",").trim();

		const latitude = Number(latStr);
		const longitude = Number(lngStr);
		if (!isFinite(latitude) || !isFinite(longitude)) continue;

		rows.push({
			id,
			eventId,
			policeStation,
			callType,
			latitude,
			longitude,
			receivedAt,
		});
	}
	return rows;
}

export async function GET() {
	try {
		const csvPath = path.join(process.cwd(), "emergency-data", "dial112.csv");
		const text = await fs.readFile(csvPath, "utf8");
		const rows = parseCsv(text);
		return NextResponse.json({ success: true, data: rows });
	} catch (error) {
		console.error("❌ Failed to load dial112.csv:", error);
		return NextResponse.json({ success: false, error: "Failed to load CSV" }, { status: 500 });
	}
}
