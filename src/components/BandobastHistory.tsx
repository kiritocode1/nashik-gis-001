"use client";

import { useState } from "react";
import historyData from "@/data/bandobastHistory.json";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface BandobastPoint {
    lat: number;
    lng: number;
    title: string;
    officer: string;
}

interface BandobastEvent {
    id: string;
    name: string;
    date: string;
    endDate?: string;
    description: string;
    stats?: {
        officers: number;
        vehicles: number;
        hours: number;
        incidents: number;
    };
    timeline?: { time: string; event: string }[];
    points: BandobastPoint[];
    // Include map data in interface even if only used by parent
    patrolPaths?: any[];
    zones?: any[];
}

interface BandobastHistoryProps {
    onSelectBandobast: (event: BandobastEvent) => void;
}

export default function BandobastHistory({ onSelectBandobast }: BandobastHistoryProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Cast import to our enhanced type
    const sortedHistory = [...historyData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) as unknown as BandobastEvent[];

    const handleSelect = (event: BandobastEvent) => {
        setSelectedId(event.id);
        onSelectBandobast(event);
    };

    return (
        <div className="space-y-6 relative ml-2">
            {/* Timeline Line */}
            <div className="absolute left-2 top-2 bottom-0 w-0.5 bg-gradient-to-b from-blue-500/20 via-blue-500/10 to-transparent" />

            {sortedHistory.map((event, index) => {
                const isSelected = selectedId === event.id;
                const date = new Date(event.date);

                return (
                    <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`relative pl-8 group cursor-pointer`}
                        onClick={() => handleSelect(event)}
                    >
                        {/* Timeline Dot */}
                        <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 transition-all duration-300 z-10 
              ${isSelected
                                ? "bg-blue-500 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)] scale-110"
                                : "bg-zinc-900 border-blue-500/30 group-hover:border-blue-400 group-hover:scale-110"}`}
                        >
                            {isSelected && (
                                <div className="absolute inset-0 rounded-full animate-ping bg-blue-500/50" />
                            )}
                        </div>

                        {/* Card */}
                        <div className={`
              rounded-xl border transition-all duration-300 overflow-hidden
              ${isSelected
                                ? "bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-900/20"
                                : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
                            }
            `}>
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className={`font-semibold text-sm transition-colors ${isSelected ? "text-blue-200" : "text-gray-200"}`}>
                                        {event.name}
                                    </h3>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/20 text-gray-400 border border-white/5">
                                        {format(date, "MMM d, yyyy")}
                                    </span>
                                </div>

                                <p className="text-xs text-gray-400 leading-relaxed mb-3 line-clamp-2">
                                    {event.description}
                                </p>

                                <div className="flex items-center gap-3 text-[10px] text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <span className="text-blue-400">📍</span>
                                        {event.points.length} Points
                                    </div>
                                    {event.endDate && (
                                        <div className="flex items-center gap-1">
                                            <span className="text-gray-600">to</span>
                                            {format(new Date(event.endDate), "MMM d")}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Expanded Details */}
                            <AnimatePresence>
                                {isSelected && (
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: "auto" }}
                                        exit={{ height: 0 }}
                                        className="border-t border-white/5 bg-black/20"
                                    >
                                        <div className="p-4 space-y-4">
                                            {/* Statistics Grid */}
                                            {event.stats && (
                                                <div className="grid grid-cols-2 gap-3 mb-4">
                                                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                                                        <div className="text-[10px] text-gray-500 uppercase">Officers</div>
                                                        <div className="text-sm font-semibold text-blue-300">{event.stats.officers}</div>
                                                    </div>
                                                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                                                        <div className="text-[10px] text-gray-500 uppercase">Vehicles</div>
                                                        <div className="text-sm font-semibold text-emerald-300">{event.stats.vehicles}</div>
                                                    </div>
                                                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                                                        <div className="text-[10px] text-gray-500 uppercase">Duration</div>
                                                        <div className="text-sm font-semibold text-amber-300">{event.stats.hours} hrs</div>
                                                    </div>
                                                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                                                        <div className="text-[10px] text-gray-500 uppercase">Incidents</div>
                                                        <div className="text-sm font-semibold text-red-300">{event.stats.incidents}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Deployment Points */}
                                            <div>
                                                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-2">
                                                    Key Points
                                                </div>
                                                <div className="space-y-1">
                                                    {event.points.slice(0, 5).map((point, idx) => (
                                                        <div key={idx} className="flex items-center justify-between text-xs px-2 py-1.5 rounded hover:bg-white/5 transition-colors">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                                <span className="text-gray-300 truncate max-w-[150px]">{point.title}</span>
                                                            </div>
                                                            <span className="text-gray-500 text-[10px]">{point.officer}</span>
                                                        </div>
                                                    ))}
                                                    {event.points.length > 5 && (
                                                        <div className="text-[10px] text-center text-gray-600 mt-1 italic">
                                                            + {event.points.length - 5} more points
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Event Timeline */}
                                            {event.timeline && (
                                                <div className="relative">
                                                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-2 pt-2 border-t border-white/5">
                                                        Timeline
                                                    </div>
                                                    <div className="space-y-3 pl-2 border-l border-white/10 ml-1">
                                                        {event.timeline.map((t, i) => (
                                                            <div key={i} className="relative pl-3">
                                                                <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-zinc-800 border border-gray-600" />
                                                                <div className="text-[10px] text-blue-400 font-mono">{t.time}</div>
                                                                <div className="text-xs text-gray-300">{t.event}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Map hint */}
                                            <div className="pt-2">
                                                <div className="w-full py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center text-xs text-blue-300 flex items-center justify-center gap-2">
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                                    </span>
                                                    Analysis loaded on map
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
