"use client";

import { useState, useCallback, useEffect } from "react";
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

export interface SidebarProps {
	children: React.ReactNode;
	processionRoutes?: React.ReactNode;
	settingsContent?: React.ReactNode;
	officerTrackingContent?: React.ReactNode;
	onActiveSectionChange?: (sectionId: string | null) => void;
}

export default function Sidebar({ children, processionRoutes, settingsContent, officerTrackingContent, onActiveSectionChange }: SidebarProps) {
	const [isOpen, setIsOpen] = useState(true);
	const [activeSection, setActiveSection] = useState<string | null>("layers");
	const [autoSave, setAutoSave] = useState(false);
	const [showCoordinates, setShowCoordinates] = useState(false);
	const [enableClustering, setEnableClustering] = useState(false);

	const [sidebarWidth, setSidebarWidth] = useState(320);
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
		<div className="fixed left-0 top-16 h-[calc(100vh-4rem)] z-50 flex pointer-events-none">
			{/* Sidebar Container */}
			<div className="relative flex pointer-events-auto">
				{/* Icon Bar */}
				<div className="w-16 bg-black/90 backdrop-blur-sm border-r border-gray-900/50 flex flex-col items-center py-4 space-y-2 shadow-xl">
					{/* Logo */}
					<div className="mb-6 p-2 rounded-lg bg-gray-900/30 border border-gray-800/40">
						<MapIcon className="w-6 h-6 text-gray-200" />
					</div>

					{/* Section Icons */}
					{sidebarSections.map((section) => {
						const IconComponent = section.icon;
						const isActive = activeSection === section.id;

						return (
							<button
								key={section.id}
								onClick={() => selectSection(section.id)}
								className={`
                  group relative w-10 h-10 rounded-lg flex items-center justify-center
                  transition-all duration-200 ease-out
                  ${isActive ? "bg-gray-900/40 border border-gray-800/60 text-gray-100" : "hover:bg-gray-900/30 text-gray-400 hover:text-gray-100"}
                `}
								title={section.title}
							>
								<IconComponent className="w-5 h-5" />

								{/* Tooltip */}
								<div className="absolute left-full ml-3 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
									{section.title}
								</div>
							</button>
						);
					})}
				</div>

				{/* Expandable Content Panel */}
				<div
					style={{ width: isOpen && activeSection ? `${sidebarWidth}px` : "0px" }}
					className={`
          bg-black/90 backdrop-blur-sm border-r border-gray-900/50 shadow-xl
          transition-[width] duration-300 ease-out overflow-hidden flex relative
          ${isResizing ? "transition-none select-none" : ""}
        `}
				>
					{/* Resize Handle */}
					{isOpen && activeSection && (
						<div
							className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500/50 active:bg-blue-500 transition-colors z-50"
							onMouseDown={startResizing}
						/>
					)}

					{activeSection && (
						<div className="h-full flex flex-col">
							{/* Header */}
							<div className="p-4 border-b border-gray-900/50">
								<div className="flex items-center justify-between">
									<div>
										<h2 className="text-lg font-semibold text-white">{sidebarSections.find((s) => s.id === activeSection)?.title}</h2>
										<p className="text-sm text-gray-400 mt-1">{sidebarSections.find((s) => s.id === activeSection)?.description}</p>
									</div>
									<button
										onClick={() => setActiveSection(null)}
										className="p-1 rounded-md hover:bg-gray-900/50 text-gray-400 hover:text-gray-100 transition-colors"
									>
										<ChevronLeftIcon className="w-4 h-4" />
									</button>
								</div>
							</div>

							{/* Content */}
							<div className="flex-1 overflow-hidden flex flex-col">
								{activeSection === "layers" && (
									<div className="flex-1 overflow-y-auto p-4">
										<div className="space-y-4">{children}</div>
									</div>
								)}

								{activeSection === "officers" && (
									<div className="flex-1 overflow-y-auto p-4">
										<div className="space-y-4">{officerTrackingContent}</div>
									</div>
								)}

								{activeSection === "search" && (
									<div className="flex-1 overflow-y-auto p-4">
										<div className="space-y-4">
											<div className="relative">
												<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
												<input
													type="text"
													placeholder="Search locations..."
													className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-800/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-600/50 focus:border-gray-600/50"
												/>
											</div>

											<div className="text-sm text-gray-400">
												<p>Quick locations:</p>
												<div className="mt-2 space-y-1">
													{["Union Square", "Golden Gate Park", "Fisherman's Wharf"].map((location) => (
														<button
															key={location}
															className="block w-full text-left px-3 py-2 rounded-md hover:bg-gray-900/50 text-gray-300 hover:text-white transition-colors"
														>
															📍 {location}
														</button>
													))}
												</div>
											</div>
										</div>
									</div>
								)}

								{activeSection === "routes" && (
									<div className="flex-1 overflow-y-auto p-4">
										<div className="space-y-4">{processionRoutes}</div>
									</div>
								)}

								{activeSection === "categories" && (
									<div className="flex-1 overflow-y-auto p-4">
										<div className="space-y-4">
											{settingsContent || (
												<div className="space-y-3">
													<h3 className="text-sm font-medium text-gray-300">Preferences</h3>
													<div className="space-y-4">
														<div className="flex items-center justify-between">
															<span className="text-sm text-gray-300">Auto-save map state</span>
															<SliderV1
																checked={autoSave}
																onChange={setAutoSave}
																id="auto-save"
															/>
														</div>
														<div className="flex items-center justify-between">
															<span className="text-sm text-gray-300">Show coordinates</span>
															<SliderV1
																checked={showCoordinates}
																onChange={setShowCoordinates}
																id="show-coordinates"
															/>
														</div>
														<div className="flex items-center justify-between">
															<span className="text-sm text-gray-300">Enable clustering</span>
															<SliderV1
																checked={enableClustering}
																onChange={setEnableClustering}
																id="enable-clustering"
															/>
														</div>
													</div>
												</div>
											)}
										</div>
									</div>
								)}

								{activeSection === "chat" && (
									<div className="flex-1 overflow-hidden">
										<ChatInterface />
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Add the GooeyFilter for the liquid toggle effects */}
		</div>
	);
}
