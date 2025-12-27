"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface StreetViewPopupProps {
	point: { lat: number; lng: number; title?: string; group?: string } | null;
	onClose: () => void;
}

export default function StreetViewPopup({ point, onClose }: StreetViewPopupProps) {
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
		const bearing = (toDeg(θ) + 360) % 360; // normalize
		return bearing;
	};

	useEffect(() => {
		if (!point) return;
		let panorama: any; // eslint-disable-line @typescript-eslint/no-explicit-any
		let cancelled = false;

		const init = () => {
			if (cancelled || !containerRef.current || !window.google?.maps) return;
			try {
				panorama = new window.google.maps.StreetViewPanorama(containerRef.current, {
					position: { lat: point.lat, lng: point.lng },
					pov: { heading: 0, pitch: 0 },
					zoom: 1,
					visible: true,
				});

				const sv = new window.google.maps.StreetViewService();
				sv.getPanorama({ location: { lat: point.lat, lng: point.lng }, radius: 120 }, (data: any, status: string) => {// eslint-disable-line @typescript-eslint/no-explicit-any
					if (cancelled) return;
					if (status === window.google.maps.StreetViewStatus.OK && data?.location?.pano) {
						panorama.setPano(data.location.pano);
						try {
							const panoLatLng = data.location.latLng;
							if (panoLatLng && typeof panoLatLng.lat === "function" && typeof panoLatLng.lng === "function") {
								const heading = computeHeading({ lat: panoLatLng.lat(), lng: panoLatLng.lng() }, { lat: point.lat, lng: point.lng });
								panorama.setPov({ heading, pitch: 0 });
							}
						} catch { }
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
			// Poll briefly until Google script is ready (already loaded by GoogleMap)
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
	}, [point]);

	if (!point) return null;

	return (
		<motion.div
			initial={{ opacity: 0, y: -10, scale: 0.98 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: -10, scale: 0.98 }}
			transition={{ type: "spring", stiffness: 320, damping: 28 }}
			className="relative w-[360px] md:w-[420px] shadow-2xl rounded-xl overflow-hidden border border-white/10 bg-[#0b1220]/90 backdrop-blur supports-[backdrop-filter]:bg-[#0b1220]/70"
		>
			<div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
				<div className="min-w-0 flex flex-col gap-1">
					{point.group && (
						<span
							className={`self-start px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded border ${(() => {
								const g = point.group.toLowerCase();
								if (g.includes("112") || g.includes("emergency")) return "bg-purple-500/20 text-purple-300 border-purple-500/30";
								if (g.includes("accident")) return "bg-red-500/20 text-red-300 border-red-500/30";
								if (g.includes("crime") || g.includes("fir")) return "bg-orange-500/20 text-orange-300 border-orange-500/30";
								if (g.includes("police")) return "bg-blue-500/20 text-blue-300 border-blue-500/30";
								if (g.includes("hospital") || g.includes("medical")) return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
								if (g.includes("bank") || g.includes("atm")) return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
								if (g.includes("cctv")) return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
								return "bg-gray-700/50 text-gray-400 border-gray-600/30";
							})()}`}
						>
							{point.group}
						</span>
					)}
					<div className="text-sm font-semibold text-gray-100 truncate">{point.title || `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`}</div>
				</div>
				<button
					aria-label="Close street view"
					onClick={onClose}
					className="ml-3 inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
				>
					<span className="text-lg leading-none">×</span>
				</button>
			</div>
			<div className="relative">
				<div
					ref={containerRef}
					className="w-full h-[220px] md:h-[260px] bg-black"
				/>
				{isReady && hasPano === false && <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">Street View not available here</div>}
			</div>
		</motion.div>
	);
}
