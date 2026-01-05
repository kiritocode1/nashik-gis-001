"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import Link from "next/link";
import {
    AlertTriangle,
    Search,
    Target,
    Layers,
    ShieldCheck,
    ClipboardCheck,
    BrainCircuit,
    Globe,
    MapPin,
    ArrowRight,
    CheckCircle2,
    Activity,
    BarChart3,
    Zap,
    Users,
    ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Data ---

const features = [
    {
        id: 1,
        title: "Risk Alerts",
        icon: AlertTriangle,
        color: "text-red-500",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/20",
        tagline: "Real-time threat detection & automated notifications",
        description: "Proactive monitoring system that identifies potential risks and sends instant alerts to concerned authorities for immediate action, minimizing response latency.",
        metrics: [
            { label: "Alert Response", value: "<5 min", icon: Zap },
            { label: "Coverage", value: "100%", icon: MapPin },
            { label: "Accuracy", value: "94%", icon: Target },
        ],
        useCases: [
            {
                title: "Crime Hotspot Alerts",
                description: "Automatic notifications when crime incidents exceed threshold levels in specific areas.",
            },
            {
                title: "Dial 112 Surge Detection",
                description: "Real-time monitoring of emergency call density to identify incidents requiring additional resources.",
            },
            {
                title: "Procession Protection",
                description: "Pre-emptive alerts for conflicts when procession routes pass through sensitive zones.",
            },
        ],
    },
    {
        id: 2,
        title: "Gap Analysis",
        icon: Search,
        color: "text-violet-500",
        bgColor: "bg-violet-500/10",
        borderColor: "border-violet-500/20",
        tagline: "Identify coverage blind spots & resource deficits",
        description: "Comprehensive spatial analysis to identify areas lacking adequate police coverage, CCTV surveillance, or emergency services, ensuring equitable safety infrastructure.",
        metrics: [
            { label: "Gaps Found", value: "47", icon: Search },
            { label: "Optimization", value: "+32%", icon: Activity },
            { label: "Coverage Up", value: "89%", icon: CheckCircle2 },
        ],
        useCases: [
            {
                title: "CCTV Blind Spots",
                description: "Spatial analysis to identify areas without surveillance, prioritizing high-crime zones.",
            },
            {
                title: "Station Accessibility",
                description: "Response time zone analysis to identify areas underserved by existing police stations.",
            },
            {
                title: "Emergency Reach",
                description: "Mapping ambulance and fire station coverage to ensure optimal emergency response.",
            },
        ],
    },
    {
        id: 3,
        title: "Cluster Targeting",
        icon: Target,
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/20",
        tagline: "Precision intervention in high-incident zones",
        description: "Advanced clustering algorithms to identify geographic patterns of crime and accidents, enabling targeted resource deployment for maximum impact.",
        metrics: [
            { label: "Clusters", value: "23", icon: MapPin },
            { label: "Incidents", value: "-28%", icon: ArrowRight },
            { label: "Efficiency", value: "+45%", icon: BarChart3 },
        ],
        useCases: [
            {
                title: "Accident Blackspots",
                description: "Identification of road segments with recurring accidents for targeted engineering interventions.",
            },
            {
                title: "Crime Hotspots",
                description: "Detection of crime concentrations by type (theft, assault) for specialized squad deployment.",
            },
            {
                title: "Patrol Focus",
                description: "Clustering of Dial 112 calls to identify areas requiring permanent patrol presence.",
            },
        ],
    },
    {
        id: 4,
        title: "Spatial Analysis",
        icon: Layers,
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-500/20",
        tagline: "Multi-dimensional geographic intelligence",
        description: "Powerful capabilities combining location data with attribute information. Perform complex queries like proximity analysis, buffers, and overlays.",
        metrics: [
            { label: "Layers", value: "15+", icon: Layers },
            { label: "Analysis Tools", value: "12", icon: Activity },
            { label: "Query Speed", value: "<2s", icon: Zap },
        ],
        useCases: [
            {
                title: "Proximity Search",
                description: "Find all sensitive locations (schools, religious places) within 500m of procession routes.",
            },
            {
                title: "Jurisdiction Filter",
                description: "Instant view of all incidents, assets, and resources within a specific police station boundary.",
            },
            {
                title: "Multi-layer Overlay",
                description: "Combine CCTV locations, crime history, and population density to identify surveillance priorities.",
            },
        ],
    },
    {
        id: 5,
        title: "Data Quality",
        icon: ShieldCheck,
        color: "text-cyan-500",
        bgColor: "bg-cyan-500/10",
        borderColor: "border-cyan-500/20",
        tagline: "Verified, validated & reliable information",
        description: "Rigorous data validation pipelines ensuring high accuracy and reliability. Every data point maps to the real world with precision.",
        metrics: [
            { label: "Accuracy", value: "97.3%", icon: Target },
            { label: "Validated", value: "100%", icon: CheckCircle2 },
            { label: "Real-time", value: "Sync", icon: Activity },
        ],
        useCases: [
            {
                title: "Automated Validation",
                description: "Geographic bounds checking ensuring all points fall strictly within Nashik district limits.",
            },
            {
                title: "Verification Flow",
                description: "Multi-level human verification process (Field Officer → Supervisor) for critical infrastructure data.",
            },
            {
                title: "Live Sync",
                description: "Continuous synchronization with external APIs and field apps to prevent data staleness.",
            },
        ],
    },
    {
        id: 6,
        title: "Improved Planning",
        icon: ClipboardCheck,
        color: "text-pink-500",
        bgColor: "bg-pink-500/10",
        borderColor: "border-pink-500/20",
        tagline: "Data-driven strategic resource allocation",
        description: "Transform raw data into actionable planning insights. move from reactive policing to predictive and strategic resource management.",
        metrics: [
            { label: "Efficiency", value: "+40%", icon: Activity },
            { label: "Utilization", value: "91%", icon: BarChart3 },
            { label: "Cost Save", value: "High", icon: CheckCircle2 },
        ],
        useCases: [
            {
                title: "Festival Security",
                description: "Comprehensive route analysis for processions with optimal police deployment suggestions.",
            },
            {
                title: "Beat Optimization",
                description: "Data-driven redrawing of beat boundaries based on incident density to balance workload.",
            },
            {
                title: "Resource Planning",
                description: "Priority ranking for new infrastructure investments (CCTV, Chowkis) based on evidence.",
            },
        ],
    },
    {
        id: 7,
        title: "Informed Decisions",
        icon: BrainCircuit,
        color: "text-indigo-500",
        bgColor: "bg-indigo-500/10",
        borderColor: "border-indigo-500/20",
        tagline: "Cross-departmental intelligence platform",
        description: "A unified dashboard that breaks silos, providing relevant insights to Police, Traffic, Municipal Corporation, and Disaster Management teams.",
        metrics: [
            { label: "Depts", value: "8+", icon: Users },
            { label: "Faster Decisions", value: "60%", icon: Zap },
            { label: "Access", value: "24/7", icon: Globe },
        ],
        useCases: [
            {
                title: "Police Force",
                description: "Crime mapping, patrol optimization, and accused tracking.",
            },
            {
                title: "Traffic Dept",
                description: "Accident analysis, congestion monitoring, and signal optimization.",
            },
            {
                title: "Municipal Corp",
                description: "Infrastructure planning and public amenity placement based on population needs.",
            },
        ],
    },
    {
        id: 8,
        title: "Digital Twin",
        icon: Globe,
        color: "text-teal-500",
        bgColor: "bg-teal-500/10",
        borderColor: "border-teal-500/20",
        tagline: "Virtual replica of Nashik's infrastructure",
        description: "A living digital representation of physical assets. Enables simulation, monitoring, and 'what-if' analysis for complex scenarios.",
        metrics: [
            { label: "Assets", value: "12k+", icon: MapPin },
            { label: "Real-time", value: "100%", icon: Activity },
            { label: "Simulation", value: "Ready", icon: Layers },
        ],
        useCases: [
            {
                title: "Asset Mapping",
                description: "Complete digital map of stations, hospitals, CCTVs, ATMs with real-time operational status.",
            },
            {
                title: "Scenario Sim",
                description: "Simulation of procession routes and emergency response plans before actual deployment.",
            },
            {
                title: "Playback",
                description: "Time-based visualization of past incidents to analyze trends and spread patterns.",
            },
        ],
    },
    {
        id: 9,
        title: "DigiPin Integration",
        icon: MapPin,
        color: "text-orange-500",
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-500/20",
        tagline: "Standardized location addressing system",
        description: "Seamless integration with India's DigiPin system, ensuring precise, standardized location identification across all datasets and agencies.",
        metrics: [
            { label: "Precision", value: "3m", icon: Target },
            { label: "Accuracy", value: "99%", icon: CheckCircle2 },
            { label: "Standard", value: "Govt", icon: ShieldCheck },
        ],
        useCases: [
            {
                title: "Precise Reporting",
                description: "DigiPin-based location capture for exact incident reporting in unaddressed areas.",
            },
            {
                title: "Asset Tagging",
                description: "Unique DigiPin codes for all mapped assets enabling instant location lookup.",
            },
            {
                title: "Inter-agency",
                description: "Common location language for Police, Fire, and Ambulance coordination.",
            },
        ],
    },
];

// --- Components ---

function FeatureSection({ feature, index }: { feature: typeof features[0]; index: number }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { amount: 0.5, margin: "-10% 0px -10% 0px" });
    const Icon = feature.icon;

    return (
        <section
            ref={ref}
            id={`feature-${feature.id}`}
            className="min-h-screen flex items-center justify-center p-6 sm:p-12 snap-start relative overflow-hidden"
        >
            {/* Background Glow */}
            <div
                className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20 transition-colors duration-1000",
                    feature.bgColor.replace("/10", "/20")
                )}
            />

            <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 relative z-10">
                {/* Left Content */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex flex-col justify-center"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <span className={cn("text-6xl font-bold opacity-30", feature.color)}>
                            0{feature.id}
                        </span>
                        <div className={cn("p-4 rounded-2xl", feature.bgColor)}>
                            <Icon className={cn("w-8 h-8", feature.color)} />
                        </div>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight leading-tight">
                        {feature.title}
                    </h2>
                    <p className={cn("text-xl mb-8 font-medium", feature.color)}>
                        {feature.tagline}
                    </p>
                    <p className="text-gray-400 text-lg leading-relaxed mb-10">
                        {feature.description}
                    </p>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-4">
                        {feature.metrics.map((metric, idx) => {
                            const MetricIcon = metric.icon;
                            return (
                                <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
                                    <MetricIcon className={cn("w-5 h-5 mb-2 opacity-70", feature.color)} />
                                    <div className="text-2xl font-bold mb-1">{metric.value}</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wider">{metric.label}</div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Right Content - Use Cases */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                    className="flex flex-col justify-center gap-6"
                >
                    <div className="flex items-center gap-3 mb-4 opacity-80">
                        <ClipboardCheck className="w-5 h-5" />
                        <span className="text-sm font-semibold uppercase tracking-wider">Key Use Cases</span>
                    </div>

                    {feature.useCases.map((useCase, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                "p-6 rounded-2xl border bg-black/40 backdrop-blur-md transition-all duration-300 hover:bg-white/5",
                                feature.borderColor
                            )}
                        >
                            <h3 className={cn("text-lg font-semibold mb-2 flex items-center gap-2", feature.color)}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                {useCase.title}
                            </h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {useCase.description}
                            </p>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

function FloatingNav() {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    return (
        <motion.div
            className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 origin-left z-50"
            style={{ scaleX }}
        />
    );
}

function SectionIndicator() {
    const [activeSection, setActiveSection] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const sections = document.querySelectorAll("section");
            let current = 0;
            sections.forEach((section) => {
                const top = section.offsetTop;
                const height = section.clientHeight;
                if (window.scrollY >= top - height / 3) {
                    const id = section.getAttribute("id");
                    if (id && id.startsWith("feature-")) {
                        current = parseInt(id.replace("feature-", ""));
                    } else if (id === "hero") {
                        current = 0;
                    }
                }
            });
            setActiveSection(current);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="fixed right-6 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-3 z-40">
            {features.map((f) => (
                <Link
                    key={f.id}
                    href={`#feature-${f.id}`}
                    className="flex items-center gap-4 group justify-end"
                >
                    <span
                        className={cn(
                            "text-xs font-semibold uppercase tracking-wider transition-all duration-300 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0",
                            activeSection === f.id ? "text-white opacity-100 translate-x-0" : "text-gray-500"
                        )}
                    >
                        {f.title}
                    </span>
                    <div
                        className={cn(
                            "w-2 h-2 rounded-full transition-all duration-300 border border-white/20",
                            activeSection === f.id
                                ? cn("h-8 bg-current", f.color)
                                : "bg-white/10 group-hover:bg-white/30"
                        )}
                    />
                </Link>
            ))}
        </div>
    );
}

export default function PresentationPage() {
    return (
        <div className="bg-slate-950 text-white min-h-screen selection:bg-blue-500/30">
            <FloatingNav />
            <SectionIndicator />

            {/* Navigation Bar */}
            <nav className="fixed top-0 left-0 right-0 z-40 p-6 flex justify-between items-center mix-blend-difference">
                <Link href="/" className="font-bold text-xl tracking-tight">
                    Nashik GIS <span className="text-blue-500">Platform</span>
                </Link>
                <Link href="/" className="px-4 py-2 text-sm font-medium border border-white/20 rounded-full hover:bg-white/10 transition-colors">
                    Exit Presentation
                </Link>
            </nav>

            {/* Hero Section */}
            <section id="hero" className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                    className="relative z-10 max-w-4xl"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-medium uppercase tracking-widest mb-8">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        Executive Briefing
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
                        STRATEGIC<br />CAPABILITIES
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-400 font-light max-w-2xl mx-auto mb-12">
                        A comprehensive overview of the Nashik GIS Platform's core modules and their operational impact.
                    </p>

                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <ChevronDown className="w-10 h-10 text-gray-600 mx-auto" />
                    </motion.div>
                </motion.div>
            </section>

            {/* Feature Sections */}
            <div className="bg-slate-950">
                {features.map((feature, index) => (
                    <FeatureSection key={feature.id} feature={feature} index={index} />
                ))}
            </div>

            {/* CTA / End Section */}
            <section className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center border-t border-white/5">
                <h2 className="text-3xl font-bold mb-8">Ready for deployment</h2>
                <Link
                    href="/"
                    className="group flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-gray-200 transition-all"
                >
                    Launch Dashboard
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
            </section>
        </div>
    );
}
