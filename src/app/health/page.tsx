"use client";

import { useState, useEffect } from "react";
import { runAllHealthChecks, type HealthCheckResult } from "@/services/healthCheck";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, Database, Loader2 } from "lucide-react";

export default function HealthPage() {
	const [results, setResults] = useState<HealthCheckResult[]>([]);
	const [loading, setLoading] = useState(false);
	const [lastChecked, setLastChecked] = useState<Date | null>(null);
	const [expandedSchemas, setExpandedSchemas] = useState<Set<number>>(new Set());

	const runHealthChecks = async () => {
		setLoading(true);
		try {
			const healthResults = await runAllHealthChecks();
			setResults(healthResults);
			setLastChecked(new Date());
		} catch (error) {
			console.error("Health check failed:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		runHealthChecks();
	}, []);

	const getStatusIcon = (status: HealthCheckResult["status"]) => {
		switch (status) {
			case "success":
				return <CheckCircle className="h-4 w-4 text-green-500" />;
			case "error":
				return <XCircle className="h-4 w-4 text-red-500" />;
			case "timeout":
				return <Clock className="h-4 w-4 text-yellow-500" />;
			default:
				return <AlertTriangle className="h-4 w-4 text-gray-500" />;
		}
	};

	const getStatusBadge = (status: HealthCheckResult["status"]) => {
		switch (status) {
			case "success":
				return (
					<Badge
						variant="default"
						className="bg-green-500"
					>
						Success
					</Badge>
				);
			case "error":
				return <Badge variant="destructive">Error</Badge>;
			case "timeout":
				return (
					<Badge
						variant="secondary"
						className="bg-yellow-500"
					>
						Timeout
					</Badge>
				);
			default:
				return <Badge variant="outline">Unknown</Badge>;
		}
	};

	const formatResponseTime = (ms: number) => {
		if (ms < 1000) return `${ms}ms`;
		return `${(ms / 1000).toFixed(2)}s`;
	};

	const successfulEndpoints = results.filter((r) => r.status === "success").length;
	const totalEndpoints = results.length;
	const averageResponseTime = results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / results.length) : 0;

	const toggleSchemaExpansion = (index: number) => {
		const newExpanded = new Set(expandedSchemas);
		if (newExpanded.has(index)) {
			newExpanded.delete(index);
		} else {
			newExpanded.add(index);
		}
		setExpandedSchemas(newExpanded);
	};

	return (
		<div className="min-h-screen bg-black text-white">
			{/* Header */}
			<div className="bg-black border-b border-gray-800">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">API Health Check</h1>
							<p className="mt-3 text-gray-400 text-lg">Monitor external API endpoints and validate data schemas</p>
						</div>
						<div className="flex items-center space-x-4">
							{lastChecked && <div className="text-sm text-gray-500 bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-800">Last checked: {lastChecked.toLocaleTimeString()}</div>}
							<Button
								onClick={runHealthChecks}
								disabled={loading}
								className="flex items-center space-x-2 bg-white text-black hover:bg-gray-200 transition-colors"
							>
								{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
								<span>Refresh</span>
							</Button>
						</div>
					</div>
				</div>
			</div>

			{/* Stats Overview */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
					<Card className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors">
						<CardContent className="p-6">
							<div className="flex items-center">
								<div className="p-3 bg-green-500/20 rounded-xl border border-green-500/30">
									<CheckCircle className="h-6 w-6 text-green-400" />
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-400">Successful</p>
									<p className="text-3xl font-bold text-white">
										{successfulEndpoints}/{totalEndpoints}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors">
						<CardContent className="p-6">
							<div className="flex items-center">
								<div className="p-3 bg-red-500/20 rounded-xl border border-red-500/30">
									<XCircle className="h-6 w-6 text-red-400" />
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-400">Failed</p>
									<p className="text-3xl font-bold text-white">{totalEndpoints - successfulEndpoints}</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors">
						<CardContent className="p-6">
							<div className="flex items-center">
								<div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
									<Clock className="h-6 w-6 text-blue-400" />
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-400">Avg Response</p>
									<p className="text-3xl font-bold text-white">{formatResponseTime(averageResponseTime)}</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors">
						<CardContent className="p-6">
							<div className="flex items-center">
								<div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/30">
									<Database className="h-6 w-6 text-purple-400" />
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-400">Total Endpoints</p>
									<p className="text-3xl font-bold text-white">{totalEndpoints}</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Results Tabs */}
				<Tabs
					defaultValue="overview"
					className="space-y-6"
				>
					<TabsList className="grid w-full grid-cols-3 bg-gray-900 border-gray-800">
						<TabsTrigger
							value="overview"
							className="text-gray-400 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:font-semibold"
						>
							Overview
						</TabsTrigger>
						<TabsTrigger
							value="details"
							className="text-gray-400 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:font-semibold"
						>
							Details
						</TabsTrigger>
						<TabsTrigger
							value="schemas"
							className="text-gray-400 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:font-semibold"
						>
							Schema Analysis
						</TabsTrigger>
					</TabsList>

					<TabsContent
						value="overview"
						className="space-y-4"
					>
						<div className="grid gap-4">
							{results.map((result, index) => (
								<Card
									key={index}
									className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-all duration-200 hover:border-gray-700"
								>
									<CardContent className="p-6">
										<div className="flex items-start justify-between">
											<div className="flex items-start space-x-4">
												{getStatusIcon(result.status)}
												<div className="flex-1">
													<div className="flex items-center space-x-3 mb-3">
														<h3 className="text-xl font-semibold text-white">{result.name}</h3>
														{getStatusBadge(result.status)}
													</div>
													<p className="text-gray-400 mb-4 text-base">{result.description}</p>
													<div className="flex items-center space-x-6 text-sm text-gray-500">
														<span className="bg-gray-800 px-3 py-1 rounded-lg">Endpoint: {result.endpoint}</span>
														<span className="bg-gray-800 px-3 py-1 rounded-lg">Response: {formatResponseTime(result.responseTime)}</span>
														{result.dataSample && result.dataSample.length > 0 && (
															<span className="bg-gray-800 px-3 py-1 rounded-lg">Sample: {result.dataSample.length} items</span>
														)}
													</div>
												</div>
											</div>
										</div>

										{result.error && (
											<Alert className="mt-4 bg-red-500/10 border-red-500/30">
												<AlertTriangle className="h-4 w-4 text-red-400" />
												<AlertDescription className="text-red-300">{result.error}</AlertDescription>
											</Alert>
										)}
									</CardContent>
								</Card>
							))}
						</div>
					</TabsContent>

					<TabsContent
						value="details"
						className="space-y-6"
					>
						<div className="grid gap-6">
							{results.map((result, index) => (
								<Card
									key={index}
									className="bg-gray-900 border-gray-800"
								>
									<CardHeader className="pb-4">
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-3">
												{getStatusIcon(result.status)}
												<CardTitle className="text-xl text-white">{result.name}</CardTitle>
												{getStatusBadge(result.status)}
											</div>
											<div className="text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded-lg">{formatResponseTime(result.responseTime)}</div>
										</div>
										<CardDescription className="text-gray-400 text-base">{result.description}</CardDescription>
									</CardHeader>
									<CardContent className="space-y-6">
										<div>
											<h4 className="font-semibold text-white mb-3 text-lg">Endpoint Details</h4>
											<div className="bg-black border border-gray-700 p-4 rounded-xl">
												<code className="text-sm text-green-400 font-mono">GET https://rhtechnology.in/nashik-gis/app.php?endpoint={result.endpoint}</code>
											</div>
										</div>

										{result.dataSample && result.dataSample.length > 0 && (
											<div>
												<h4 className="font-semibold text-white mb-3 text-lg">Sample Data (First 5 Objects)</h4>
												<div className="bg-black border border-gray-700 rounded-xl overflow-hidden">
													<ScrollArea className="h-80 w-full">
														<pre className="p-6 text-xs text-gray-300 font-mono leading-relaxed">{JSON.stringify(result.dataSample, null, 2)}</pre>
													</ScrollArea>
												</div>
											</div>
										)}

										{result.error && (
											<Alert className="bg-red-500/10 border-red-500/30">
												<AlertTriangle className="h-4 w-4 text-red-400" />
												<AlertDescription className="text-red-300">{result.error}</AlertDescription>
											</Alert>
										)}
									</CardContent>
								</Card>
							))}
						</div>
					</TabsContent>

					<TabsContent
						value="schemas"
						className="space-y-6"
					>
						<div className="grid gap-6">
							{results.map((result, index) => {
								const isExpanded = expandedSchemas.has(index);
								const hasErrors = !result.schemaValidation.isValid && result.schemaValidation.errors;
								const hasDifferences =
									result.schemaDifferences &&
									(result.schemaDifferences.missingFields.length > 0 || result.schemaDifferences.extraFields.length > 0 || result.schemaDifferences.typeMismatches.length > 0);

								return (
									<Card
										key={index}
										className="bg-gray-900 border-gray-800"
									>
										<CardHeader className="pb-4">
											<div className="flex items-center justify-between">
												<div className="flex items-center space-x-3">
													{getStatusIcon(result.status)}
													<CardTitle className="text-xl text-white">{result.name}</CardTitle>
													<Badge
														variant={result.schemaValidation.isValid ? "default" : "destructive"}
														className={result.schemaValidation.isValid ? "bg-green-500 text-black" : "bg-red-500 text-white"}
													>
														{result.schemaValidation.isValid ? "Valid" : "Invalid"}
													</Badge>
												</div>
											</div>
											<CardDescription className="text-gray-400 text-base">{result.description}</CardDescription>
										</CardHeader>
										<CardContent className="space-y-4">
											{result.schemaValidation.isValid ? (
												<div className="flex items-center space-x-3 text-green-400 bg-green-500/10 border border-green-500/30 p-4 rounded-xl">
													<CheckCircle className="h-5 w-5" />
													<span className="font-semibold">Schema validation passed</span>
												</div>
											) : (
												<div className="space-y-4">
													{/* Aggregated Summary */}
													<div className="flex flex-wrap gap-3">
														{hasErrors && (
															<button
																onClick={() => toggleSchemaExpansion(index)}
																className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors"
															>
																<XCircle className="h-4 w-4 text-red-400" />
																<span className="text-red-400 font-medium">{result.schemaValidation.errors?.issues.length || 0} Validation Errors</span>
																<span className="text-red-300 text-sm">{isExpanded ? "▼" : "▶"}</span>
															</button>
														)}

														{hasDifferences && (
															<button
																onClick={() => toggleSchemaExpansion(index)}
																className="flex items-center space-x-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg hover:bg-yellow-500/30 transition-colors"
															>
																<AlertTriangle className="h-4 w-4 text-yellow-400" />
																<span className="text-yellow-400 font-medium">
																	{result.schemaDifferences?.missingFields.length || 0} Missing, {result.schemaDifferences?.extraFields.length || 0} Extra,{" "}
																	{result.schemaDifferences?.typeMismatches.length || 0} Type Issues
																</span>
																<span className="text-yellow-300 text-sm">{isExpanded ? "▼" : "▶"}</span>
															</button>
														)}
													</div>

													{/* Expanded Details */}
													{isExpanded && (
														<div className="space-y-4 border-t border-gray-700 pt-4">
															{hasErrors && (
																<div>
																	<h4 className="font-semibold text-red-400 mb-3 text-lg">Validation Errors</h4>
																	<div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
																		<div className="space-y-2">
																			{result.schemaValidation.errors?.issues.map((issue, i) => (
																				<div
																					key={i}
																					className="p-3 bg-red-500/20 rounded-lg"
																				>
																					<div className="font-semibold text-red-300">{issue.path.join(".") || "root"}</div>
																					<div className="text-red-200 text-sm mt-1">{issue.message}</div>
																				</div>
																			))}
																		</div>
																	</div>
																</div>
															)}

															{hasDifferences && (
																<div>
																	<h4 className="font-semibold text-yellow-400 mb-3 text-lg">Schema Differences</h4>
																	<div className="space-y-4">
																		{result.schemaDifferences?.missingFields && result.schemaDifferences.missingFields.length > 0 && (
																			<div>
																				<h5 className="text-sm font-semibold text-gray-300 mb-2">Missing Fields</h5>
																				<div className="flex flex-wrap gap-2">
																					{result.schemaDifferences.missingFields.map((field, i) => (
																						<Badge
																							key={i}
																							variant="outline"
																							className="text-red-400 border-red-500/50 bg-red-500/10"
																						>
																							{field}
																						</Badge>
																					))}
																				</div>
																			</div>
																		)}

																		{result.schemaDifferences?.extraFields && result.schemaDifferences.extraFields.length > 0 && (
																			<div>
																				<h5 className="text-sm font-semibold text-gray-300 mb-2">Extra Fields</h5>
																				<div className="flex flex-wrap gap-2">
																					{result.schemaDifferences.extraFields.map((field, i) => (
																						<Badge
																							key={i}
																							variant="outline"
																							className="text-blue-400 border-blue-500/50 bg-blue-500/10"
																						>
																							{field}
																						</Badge>
																					))}
																				</div>
																			</div>
																		)}

																		{result.schemaDifferences?.typeMismatches && result.schemaDifferences.typeMismatches.length > 0 && (
																			<div>
																				<h5 className="text-sm font-semibold text-gray-300 mb-2">Type Mismatches</h5>
																				<div className="space-y-2">
																					{result.schemaDifferences.typeMismatches.map((mismatch, i) => (
																						<div
																							key={i}
																							className="text-sm bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg"
																						>
																							<span className="font-semibold text-yellow-300">{mismatch.field}</span>: expected{" "}
																							<span className="text-green-400 font-mono">{mismatch.expected}</span>, got{" "}
																							<span className="text-red-400 font-mono">{mismatch.actual}</span>
																						</div>
																					))}
																				</div>
																			</div>
																		)}
																	</div>
																</div>
															)}
														</div>
													)}
												</div>
											)}
										</CardContent>
									</Card>
								);
							})}
						</div>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
