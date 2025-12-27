"use client";

import { useState, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { SliderV1 } from "./NewToggle";
import ChatInterface from "./ChatInterface";

// Simple icon components to avoid external dependencies
const MapIcon = ({ className }: { className?: string }) => (
	<svg
		className={className}
		fill="none"
		stroke="currentColor"
		viewBox="0 0 24 24"
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
		/>
	</svg>
);

const LayersIcon = ({ className }: { className?: string }) => (
	<svg
		className={className}
		fill="none"
		stroke="currentColor"
		viewBox="0 0 24 24"
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
		/>
	</svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
	<svg
		className={className}
		fill="none"
		stroke="currentColor"
		viewBox="0 0 24 24"
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
		/>
	</svg>
);

const SettingsIcon = ({ className }: { className?: string }) => (
	<svg
		className={className}
		fill="none"
		stroke="currentColor"
		viewBox="0 0 24 24"
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
		/>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
		/>
	</svg>
);

// New icon for Categories section
const CategoriesIcon = ({ className }: { className?: string }) => (
	<svg
		className={className}
		fill="none"
		stroke="currentColor"
		viewBox="0 0 24 24"
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			d="M4 6h16M4 12h16M4 18h16" // three lines representing grouped categories
		/>
	</svg>
);

const ChevronLeftIcon = ({ className }: { className?: string }) => (
	<svg
		className={className}
		fill="none"
		stroke="currentColor"
		viewBox="0 0 24 24"
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			d="M15 19l-7-7 7-7"
		/>
	</svg>
);

// ChevronRightIcon removed as it's not currently used

const RouteIcon = ({ className }: { className?: string }) => (
	<svg
		className={className}
		fill="none"
		stroke="currentColor"
		viewBox="0 0 24 24"
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
		/>
	</svg>
);

const ChatIcon = ({ className }: { className?: string }) => (
	<svg
		className={className}
		fill="none"
		stroke="currentColor"
		viewBox="0 0 24 24"
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
		/>
	</svg>
);

const EmergencyIcon = ({ className }: { className?: string }) => (
	<svg
		className={className}
		fill="none"
		stroke="currentColor"
		viewBox="0 0 24 24"
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
		/>
	</svg>
);

// ... existing icons ...

const sidebarSections = [
	{
		id: "layers",
		icon: LayersIcon,
		title: "Layers",
		description: "Manage map layers",
	},
	{
		id: "officers",
		icon: ({ className }: { className?: string }) => (
			<svg
				className={className}
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
				/>
			</svg>
		),
		title: "Officer Tracking",
		description: "Live officer locations",
	},
	{
		id: "search",
		icon: SearchIcon,
		title: "Search",
		description: "Search locations",
	},
	{
		id: "emergency",
		icon: EmergencyIcon,
		title: "Emergency Mode",
		description: "Find nearest safe spots",
	},
	{
		id: "routes",
		icon: RouteIcon,
		title: "Procession Routes",
		description: "Manage festival routes",
	},
	{
		id: "categories",
		icon: CategoriesIcon,
		title: "Categories",
		description: "Browse and toggle categories",
	},
	{
		id: "chat",
		icon: ChatIcon,
		title: "AI Assistant",
		description: "Chat with AI about crime data",
	},
];

export interface SearchResult {
	id: string | number;
	title: string;
	subtitle?: string;
	type: string;
	position: { lat: number; lng: number };
}

export interface SidebarProps {
	children: React.ReactNode;
	emergencyContent?: React.ReactNode;
	processionRoutes?: React.ReactNode;
	settingsContent?: React.ReactNode;
	officerTrackingContent?: React.ReactNode;
	onActiveSectionChange?: (sectionId: string | null) => void;
	onSearch?: (query: string) => void;
	searchResults?: SearchResult[];
	onSearchResultClick?: (result: SearchResult) => void;
	isSearching?: boolean;
}

// Helper component for Search Result Groups (Accordions)
const SearchResultGroup = ({
	type,
	results,
	onResultClick
}: {
	type: string;
	results: SearchResult[];
	onResultClick?: (result: SearchResult) => void;
}) => {
	const [isExpanded, setIsExpanded] = useState(true);

	const getTypeIcon = (type: string) => {
		switch (type.toLowerCase()) {
			case 'police station': return '🚔';
			case 'hospital': return '🏥';
			case 'bank': return '🏦';
			case 'atm': return '🏧';
			case 'cctv': return '🎥';
			case 'officer': return '👮';
			case 'accident': return '🚗';
			case 'dial 112 call': return '🚨';
			case 'area summary': return '📍';
			default: return '📌';
		}
	};

	return (
		<div className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02]">
			{/* Accordion Header */}
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="w-full flex items-center justify-between p-3.5 bg-white/[0.03] hover:bg-white/[0.05] transition-all group"
			>
				<div className="flex items-center gap-2.5">
					<span className="text-lg">{getTypeIcon(type)}</span>
					<div className="text-left">
						<h3 className="text-sm font-semibold text-gray-200 group-hover:text-blue-200 transition-colors">
							{type}
						</h3>
						<p className="text-xs text-gray-500">
							{results.length} result{results.length !== 1 ? 's' : ''}
						</p>
					</div>
				</div>
				<svg
					className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
				</svg>
			</button>

			{/* Accordion Content */}
			<div
				className={`transition-all duration-200 ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
					} overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent`}
			>
				<div className="p-2 space-y-1.5">
					{results.map((result) => (
						<button
							key={`${result.type}-${result.id}`}
							onClick={() => onResultClick?.(result)}
							className="w-full text-left p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-blue-500/20 transition-all group relative overflow-hidden"
						>
							<div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-transparent transition-all duration-500" />
							<div className="relative z-10">
								<h4 className="font-medium text-gray-200 group-hover:text-blue-200 transition-colors text-sm">
									{result.title}
								</h4>
								{result.subtitle && <p className="text-xs text-gray-500 mt-1">{result.subtitle}</p>}
							</div>
						</button>
					))}
				</div>
			</div>
		</div>
	);
};

export default function Sidebar({
	children,
	processionRoutes,
	emergencyContent, // Added
	settingsContent,
	officerTrackingContent,
	onActiveSectionChange,
	onSearch,
	searchResults = [],
	onSearchResultClick,
	isSearching = false,
}: SidebarProps) {
	const [isOpen, setIsOpen] = useState(true);
	const [activeSection, setActiveSection] = useState<string | null>("layers");
	const [autoSave, setAutoSave] = useState(false);
	const [showCoordinates, setShowCoordinates] = useState(false);
	const [enableClustering, setEnableClustering] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const query = e.target.value;
		setSearchQuery(query);
		if (onSearch) {
			onSearch(query);
		}
	};

	const [sidebarWidth, setSidebarWidth] = useState(400);
	const [isResizing, setIsResizing] = useState(false);

	const startResizing = useCallback(() => {
		setIsResizing(true);
	}, []);

	const stopResizing = useCallback(() => {
		setIsResizing(false);
	}, []);

	const resize = useCallback(
		(mouseMoveEvent: MouseEvent) => {
			if (isResizing) {
				// Subtract icon bar width (64px / 4rem) from mouse X to get content width
				const newWidth = mouseMoveEvent.clientX - 64;
				if (newWidth >= 250 && newWidth <= 600) {
					setSidebarWidth(newWidth);
				}
			}
		},
		[isResizing],
	);

	useEffect(() => {
		window.addEventListener("mousemove", resize);
		window.addEventListener("mouseup", stopResizing);
		return () => {
			window.removeEventListener("mousemove", resize);
			window.removeEventListener("mouseup", stopResizing);
		};
	}, [resize, stopResizing]);



	// toggleSidebar removed as it's not currently used

	const selectSection = (sectionId: string) => {
		const newSection = activeSection === sectionId ? null : sectionId;
		setActiveSection(newSection);
		if (onActiveSectionChange) {
			onActiveSectionChange(newSection);
		}
		if (newSection && !isOpen) {
			setIsOpen(true);
		}
	};

	return (
		<div className="fixed left-0 top-16 h-[calc(100vh-4rem)] z-[40] flex pointer-events-none font-sans">
			{/* Sidebar Container */}
			<div className="relative flex pointer-events-auto shadow-2xl shadow-black/50">
				{/* Icon Bar */}
				<div className="w-16 bg-black/90 backdrop-blur-md border-r border-white/5 flex flex-col items-center py-4 space-y-4 z-20 overflow-y-auto no-scrollbar">
					{/* Logo Area */}
					<div className="mb-2 p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
						<MapIcon className="w-6 h-6" />
					</div>

					<div className="w-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

					{/* Section Icons */}
					<div className="flex flex-col space-y-2 w-full px-2">
						{sidebarSections.map((section) => {
							const IconComponent = section.icon;
							const isActive = activeSection === section.id;

							return (
								<button
									key={section.id}
									onClick={() => selectSection(section.id)}
									className={`
										group relative w-full aspect-square rounded-xl flex items-center justify-center
										transition-all duration-300 ease-out outline-none
										${isActive
											? "bg-blue-600 text-white shadow-lg shadow-blue-900/50 translate-x-1"
											: "text-gray-400 hover:text-gray-100 hover:bg-white/5 hover:scale-105 active:scale-95"}
									`}
									title={section.title}
								>
									<IconComponent className={`w-5 h-5 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />

									{/* Tooltip */}
									<div className="absolute left-full ml-4 px-3 py-1.5 bg-zinc-900 text-gray-200 text-xs font-medium rounded-lg opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 border border-white/10 shadow-xl">
										{section.title}
										<div className="absolute top-1/2 left-0 w-1 h-1 -ml-0.5 bg-zinc-900 -translate-y-1/2 rotate-45 border-l border-b border-white/10" />
									</div>
								</button>
							);
						})}
					</div>
				</div>

				{/* Expandable Content Panel */}
				<div
					style={{ width: isOpen && activeSection ? `${sidebarWidth}px` : "0px" }}
					className={`
						bg-black/95 backdrop-blur-xl border-r border-white/5 
						transition-[width] duration-500 cubic-bezier(0.16, 1, 0.3, 1) overflow-hidden flex relative
						${isResizing ? "transition-none select-none" : ""}
					`}
				>
					{/* Resize Handle */}
					{isOpen && activeSection && (
						<div
							className="absolute right-0 top-0 bottom-0 w-1 hover:w-1.5 group cursor-col-resize z-50 flex justify-center"
							onMouseDown={startResizing}
						>
							<div className="w-px h-full bg-white/5 group-hover:bg-blue-500/50 transition-colors" />
						</div>
					)}

					{activeSection && (
						<div className="h-full flex flex-col min-w-[250px] w-full">
							{/* Header */}
							<div className="px-5 py-4 border-b border-white/5 bg-white/[0.02]">
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<h2 className="text-lg font-semibold text-gray-100 tracking-tight">
											{sidebarSections.find((s) => s.id === activeSection)?.title}
										</h2>
										<p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
											{sidebarSections.find((s) => s.id === activeSection)?.description}
										</p>
									</div>
									<button
										onClick={() => setActiveSection(null)}
										className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-gray-200 transition-colors"
									>
										<ChevronLeftIcon className="w-4 h-4" />
									</button>
								</div>
							</div>

							{/* Content */}
							<div className="flex-1 overflow-hidden flex flex-col relative">
								{/* Background Pattern */}
								<div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.2))] pointer-events-none" />

								{activeSection === "layers" && (
									<div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
										<div className="space-y-4">{children}</div>
									</div>
								)}

								{activeSection === "officers" && (
									<div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
										<div className="space-y-4">{officerTrackingContent}</div>
									</div>
								)}

								{activeSection === "search" && (
									<div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
										<div className="space-y-5">
											{/* Search Content */}
											<div className="sticky top-0 -mx-5 px-5 pb-4 bg-black/95 backdrop-blur-xl z-10 border-b border-white/5">
												<div className="relative group">
													<SearchIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
													<input
														type="text"
														placeholder="Search locations..."
														value={searchQuery}
														onChange={handleSearchChange}
														className="w-full pl-10 pr-10 py-2.5 bg-zinc-900/50 hover:bg-zinc-900 border border-white/5 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all font-medium text-sm shadow-inner"
													/>
													{isSearching && (
														<div className="absolute right-3.5 top-1/2 transform -translate-y-1/2">
															<Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
														</div>
													)}
												</div>
											</div>

											<div className="space-y-2">
												{searchResults && searchResults.length > 0 ? (() => {
													// Group results by type
													const groupedResults = searchResults.reduce((acc, result) => {
														const type = result.type;
														if (!acc[type]) {
															acc[type] = [];
														}
														acc[type].push(result);
														return acc;
													}, {} as Record<string, SearchResult[]>);

													return (
														<div className="space-y-2">
															{Object.entries(groupedResults).map(([type, results]) => (
																<SearchResultGroup
																	key={type}
																	type={type}
																	results={results}
																	onResultClick={onSearchResultClick}
																/>
															))}
														</div>
													);
												})() : searchQuery.length > 0 && !isSearching ? (
													<div className="flex flex-col items-center justify-center py-10 opacity-50">
														<SearchIcon className="w-8 h-8 text-gray-600 mb-2" />
														<p className="text-sm text-gray-500 font-medium">No results found</p>
													</div>
												) : (
													!isSearching && (
														<div className="text-sm">
															<p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Suggested Searches</p>
															<div className="grid grid-cols-2 gap-2">
																{["Police Stations", "Hospitals", "ATMs & Banks", "Officers"].map((item) => (
																	<div key={item} className="p-3 rounded-lg border border-white/5 bg-white/[0.02] text-gray-400 hover:text-gray-200 hover:bg-white/5 hover:border-white/10 transition-all cursor-pointer text-xs font-medium text-center">
																		{item}
																	</div>
																))}
															</div>
														</div>
													)
												)}
											</div>
										</div>
									</div>
								)}

								{activeSection === "emergency" && (
									<div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
										<div className="space-y-4">{emergencyContent}</div>
									</div>
								)}

								{activeSection === "routes" && (
									<div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
										<div className="space-y-4">{processionRoutes}</div>
									</div>
								)}

								{activeSection === "categories" && (
									<div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
										<div className="space-y-4">
											{settingsContent || (
												<div className="space-y-6">
													<div>
														<h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Map Preferences</h3>
														<div className="space-y-4">
															<div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
																<span className="text-sm font-medium text-gray-300">Auto-save state</span>
																<SliderV1
																	checked={autoSave}
																	onChange={setAutoSave}
																	id="auto-save"
																/>
															</div>
															<div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
																<span className="text-sm font-medium text-gray-300">Show coordinates</span>
																<SliderV1
																	checked={showCoordinates}
																	onChange={setShowCoordinates}
																	id="show-coordinates"
																/>
															</div>
															<div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
																<span className="text-sm font-medium text-gray-300">Enable clustering</span>
																<SliderV1
																	checked={enableClustering}
																	onChange={setEnableClustering}
																	id="enable-clustering"
																/>
															</div>
														</div>
													</div>
												</div>
											)}
										</div>
									</div>
								)}

								{activeSection === "chat" && (
									<div className="flex-1 overflow-hidden h-full">
										<ChatInterface />
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div >
	);
}
