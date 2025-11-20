"use client";

import { motion } from "framer-motion";
import { OfficerDutyLocation } from "@/services/smartBandobastApis";
import { useEffect, useRef, useState } from "react";

interface OfficerPopupProps {
	officer: OfficerDutyLocation;
	onClose: () => void;
}

export default function OfficerPopup({ officer, onClose }: OfficerPopupProps) {
	const isLive = officer.location.source?.toLowerCase() === "live";
	const statusColor = isLive ? "text-emerald-400" : "text-rose-400";
	const statusBg = isLive ? "bg-emerald-500/10" : "bg-rose-500/10";
	const statusBorder = isLive ? "border-emerald-500/20" : "border-rose-500/20";

	const containerRef = useRef<HTMLDivElement>(null);
	const [isReady, setIsReady] = useState(false);
	const [hasPano, setHasPano] = useState<boolean | null>(null);

	// Compute compass heading from one lat/lng to another
	const computeHeading = (from: { lat: number; lng: number }, to: { lat: number; lng: number }): number => {
		const toRad = (deg: number) => (deg * Math.PI) / 180;
		const toDeg = (rad: number) => (rad * 180) / Math.PI;
		const φ1 = toRad(from.lat);
		const φ2 = toRad(to.lat);
		const Δλ = toRad(to.lng - from.lng);
		const y = Math.sin(Δλ) * Math.cos(φ2);
		const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
		const θ = Math.atan2(y, x);
		return (toDeg(θ) + 360) % 360;
	};

	useEffect(() => {
		if (!officer.location.latitude || !officer.location.longitude) return;

		const point = { lat: officer.location.latitude, lng: officer.location.longitude };
		let panorama: any; // eslint-disable-line @typescript-eslint/no-explicit-any
		let cancelled = false;

		const init = () => {
			if (cancelled || !containerRef.current || !window.google?.maps) return;
			try {
				panorama = new window.google.maps.StreetViewPanorama(containerRef.current, {
					position: point,
					pov: { heading: 0, pitch: 0 },
					zoom: 1,
					visible: true,
					disableDefaultUI: true, // Cleaner look
					addressControl: false,
					linksControl: false,
					panControl: false,
					enableCloseButton: false,
					fullscreenControl: false,
				});

				const sv = new window.google.maps.StreetViewService();
				sv.getPanorama({ location: point, radius: 100 }, (data: any, status: string) => {
					if (cancelled) return;
					if (status === window.google.maps.StreetViewStatus.OK && data?.location?.pano) {
						panorama.setPano(data.location.pano);
						try {
							const panoLatLng = data.location.latLng;
							if (panoLatLng && typeof panoLatLng.lat === "function") {
								const heading = computeHeading({ lat: panoLatLng.lat(), lng: panoLatLng.lng() }, point);
								panorama.setPov({ heading, pitch: 0 });
							}
						} catch {}
						setHasPano(true);
					} else {
						setHasPano(false);
					}
					setIsReady(true);
				});
			} catch {
				setHasPano(false);
				setIsReady(true);
			}
		};

		if (window.google?.maps) {
			init();
		} else {
			const id = window.setInterval(() => {
				if (window.google?.maps) {
					window.clearInterval(id);
					init();
				}
			}, 200);
			return () => window.clearInterval(id);
		}

		return () => {
			cancelled = true;
		};
	}, [officer.location.latitude, officer.location.longitude]);

	return (
		<motion.div
			initial={{ opacity: 0, x: 20, scale: 0.95 }}
			animate={{ opacity: 1, x: 0, scale: 1 }}
			exit={{ opacity: 0, x: 20, scale: 0.95 }}
			transition={{ type: "spring", stiffness: 300, damping: 30 }}
			className="w-[380px] bg-black/90 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
		>
			{/* Street View Section - Takes top half */}
			<div className="relative h-[220px] bg-gray-900 border-b border-gray-800">
				<div
					ref={containerRef}
					className="absolute inset-0 w-full h-full"
				/>

				{/* Overlay Gradient for text readability */}
				<div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent pointer-events-none" />

				{/* Close Button */}
				<button
					onClick={onClose}
					className="absolute top-3 right-3 z-20 h-8 w-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors shadow-lg"
				>
					<svg
						className="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>

				{/* Fallback or Loading State */}
				{!isReady && (
					<div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-gray-500 text-xs">
						<div className="flex items-center space-x-2">
							<div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
							<span>Loading Street View...</span>
						</div>
					</div>
				)}
				{isReady && hasPano === false && (
					<div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
						<div className="text-center p-4">
							<div className="text-2xl mb-2">🗺️</div>
							<div className="text-xs text-gray-400">No Street View available here</div>
						</div>
					</div>
				)}

				{/* Status Badge */}
				<div className="absolute bottom-3 right-3 z-10">
					<span
						className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide backdrop-blur-md shadow-lg border ${statusBg} ${statusColor} ${statusBorder}`}
					>
						<span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isLive ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
						{isLive ? "Live" : "Offline"}
					</span>
				</div>
			</div>

			{/* Details Section */}
			<div className="p-4 space-y-4 bg-gradient-to-b from-gray-900/50 to-black/50">
				{/* Name and Rank - Moved here for better readability */}
				<div className="flex items-center space-x-3 pb-3 border-b border-white/5">
					<div className="h-10 w-10 shrink-0 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xl shadow-sm">👮‍♂️</div>
					<div>
						<h3 className="font-bold text-white text-sm leading-tight">{officer.name}</h3>
						<p className="text-xs text-gray-400 font-medium mt-0.5">{officer.rank}</p>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<div className="space-y-1">
						<div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Mobile</div>
						<div className="text-sm font-mono text-gray-200 bg-white/5 rounded px-2 py-1 inline-block border border-white/5">{officer.mobileNumber}</div>
					</div>
					<div className="space-y-1">
						<div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Sevarth ID</div>
						<div className="text-sm font-mono text-gray-200 bg-white/5 rounded px-2 py-1 inline-block border border-white/5">{officer.sevrathId}</div>
					</div>
				</div>

				<div className="space-y-3 pt-2 border-t border-white/5">
					<div className="flex items-start space-x-3">
						<div className="shrink-0 mt-0.5 text-gray-500">📍</div>
						<div>
							<div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-0.5">Duty Point</div>
							<div className="text-xs text-gray-200 leading-relaxed">{officer.pointName || "—"}</div>
						</div>
					</div>

					<div className="flex items-start space-x-3">
						<div className="shrink-0 mt-0.5 text-gray-500">📅</div>
						<div>
							<div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-0.5">Event</div>
							<div className="text-xs text-gray-200 leading-relaxed">{officer.eventName || "—"}</div>
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="pt-3 mt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
					<div className="flex items-center space-x-1">
						<svg
							className="w-3 h-3"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<span>Updated {new Date(officer.location.lastUpdated).toLocaleString()}</span>
					</div>

					<button
						onClick={(e) => {
							e.stopPropagation();
							navigator.clipboard.writeText(`${officer.location.latitude}, ${officer.location.longitude}`);
						}}
						className="flex items-center space-x-1.5 text-blue-400 hover:text-blue-300 transition-colors group"
					>
						<span className="font-mono group-hover:underline">
							{officer.location.latitude.toFixed(4)}, {officer.location.longitude.toFixed(4)}
						</span>
						<svg
							className="w-3 h-3"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
							/>
						</svg>
					</button>
				</div>
			</div>
		</motion.div>
	);
}
