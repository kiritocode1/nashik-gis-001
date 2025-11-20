"use client";

import { motion } from "framer-motion";
import { OfficerDutyLocation } from "@/services/smartBandobastApis";

interface OfficerPopupProps {
	officer: OfficerDutyLocation;
	onClose: () => void;
}

export default function OfficerPopup({ officer, onClose }: OfficerPopupProps) {
	const isLive = officer.location.source === "live";
	const statusColor = isLive ? "text-green-400" : "text-red-400";
	const statusBg = isLive ? "bg-green-500/20" : "bg-red-500/20";
	const statusBorder = isLive ? "border-green-500/30" : "border-red-500/30";

	return (
		<motion.div
			initial={{ opacity: 0, x: 20, scale: 0.95 }}
			animate={{ opacity: 1, x: 0, scale: 1 }}
			exit={{ opacity: 0, x: 20, scale: 0.95 }}
			transition={{ duration: 0.2 }}
			className="w-[340px] bg-black/90 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl overflow-hidden"
		>
			{/* Header */}
			<div className="flex items-start justify-between p-4 border-b border-gray-700/50 bg-gray-900/50">
				<div className="flex items-center space-x-3">
					<div className="shrink-0 w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
						<span className="text-lg">👮‍♂️</span>
					</div>
					<div>
						<h3 className="font-bold text-gray-100 text-sm leading-tight">{officer.name}</h3>
						<div className="flex items-center mt-1 space-x-2">
							<span className={`text-[10px] font-medium px-1.5 py-0.5 rounded uppercase border ${statusBg} ${statusColor} ${statusBorder}`}>{isLive ? "● LIVE" : "● OFFLINE"}</span>
							<span className="text-xs text-gray-400">{officer.rank}</span>
						</div>
					</div>
				</div>
				<button
					onClick={onClose}
					className="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
				>
					<svg
						className="w-5 h-5"
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
			</div>

			{/* Content */}
			<div className="p-4 space-y-3 text-sm">
				<div className="grid grid-cols-3 gap-2">
					<div className="text-gray-500 text-xs uppercase tracking-wider font-medium pt-1">Sevarth ID</div>
					<div className="col-span-2 text-gray-200 font-mono text-xs bg-gray-800/50 px-2 py-1 rounded border border-gray-700/50">{officer.sevrathId}</div>
				</div>

				<div className="grid grid-cols-3 gap-2">
					<div className="text-gray-500 text-xs uppercase tracking-wider font-medium pt-1">Mobile</div>
					<div className="col-span-2 text-gray-200 font-mono text-xs">{officer.mobileNumber}</div>
				</div>

				<div className="grid grid-cols-3 gap-2">
					<div className="text-gray-500 text-xs uppercase tracking-wider font-medium pt-1">Event</div>
					<div className="col-span-2 text-gray-200">{officer.eventName}</div>
				</div>

				<div className="grid grid-cols-3 gap-2">
					<div className="text-gray-500 text-xs uppercase tracking-wider font-medium pt-1">Point</div>
					<div className="col-span-2 text-gray-200">{officer.pointName}</div>
				</div>

				<div className="border-t border-gray-700/50 my-2"></div>

				<div className="grid grid-cols-3 gap-2">
					<div className="text-gray-500 text-xs uppercase tracking-wider font-medium pt-1">Updated</div>
					<div className="col-span-2 text-gray-200 text-xs">{new Date(officer.location.lastUpdated).toLocaleString()}</div>
				</div>

				<div className="grid grid-cols-3 gap-2">
					<div className="text-gray-500 text-xs uppercase tracking-wider font-medium pt-1">Coords</div>
					<div className="col-span-2 text-gray-200 font-mono text-xs flex items-center space-x-2">
						<span>
							{officer.location.latitude.toFixed(6)}, {officer.location.longitude.toFixed(6)}
						</span>
						<button
							className="text-blue-400 hover:text-blue-300"
							onClick={(e) => {
								e.stopPropagation();
								navigator.clipboard.writeText(`${officer.location.latitude}, ${officer.location.longitude}`);
							}}
							title="Copy coordinates"
						>
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
			</div>
		</motion.div>
	);
}
