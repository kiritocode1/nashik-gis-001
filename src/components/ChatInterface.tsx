"use client";

import { useChat } from "@ai-sdk/react";

import { Mic, MicOff, Send, Trash2, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function ChatInterface() {

	const { messages, sendMessage, setMessages, status, error, stop } = useChat();

	const isLoading = status === "streaming" || status === "submitted";

	const messagesEndRef = useRef<HTMLDivElement | null>(null);

	// 1. Define local input state
	const [input, setInput] = useState("");

	// Voice recognition state
	const [isListening, setIsListening] = useState(false);
	const [voiceError, setVoiceError] = useState<string | null>(null);
	const recognitionRef = useRef<SpeechRecognition | null>(null);

	// Initialize Speech Recognition
	useEffect(() => {
		// Check for browser support
		if (typeof window !== 'undefined') {
			const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

			if (SpeechRecognition) {
				const recognition = new SpeechRecognition();
				recognition.continuous = false;
				recognition.lang = "en-US";
				recognition.interimResults = false;
				recognition.maxAlternatives = 1;

				recognition.onstart = () => {
					setIsListening(true);
					setVoiceError(null); // Clear any previous errors
				};

				recognition.onresult = (event: SpeechRecognitionEvent) => {
					const transcript = event.results[0][0].transcript;
					setInput(transcript);
					setVoiceError(null);
				};

				recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
					console.error("Speech recognition error:", event.error);
					setIsListening(false);

					// Provide user-friendly error messages
					let errorMessage = "";
					switch (event.error) {
						case 'network':
							errorMessage = "Voice recognition requires an internet connection. Please check your network.";
							break;
						case 'no-speech':
							errorMessage = "No speech detected. Please try again.";
							break;
						case 'not-allowed':
						case 'service-not-allowed':
							errorMessage = "Microphone access denied. Please allow microphone permissions.";
							break;
						case 'aborted':
							errorMessage = "Voice recognition was cancelled.";
							break;
						case 'audio-capture':
							errorMessage = "No microphone detected. Please check your audio device.";
							break;
						default:
							errorMessage = `Voice recognition error: ${event.error}`;
					}

					setVoiceError(errorMessage);

					// Auto-clear error after 5 seconds
					setTimeout(() => setVoiceError(null), 5000);
				};

				recognition.onend = () => {
					setIsListening(false);
				};

				recognitionRef.current = recognition;
			}
		}

		return () => {
			if (recognitionRef.current) {
				recognitionRef.current.stop();
			}
		};
	}, []);

	// Voice recognition handlers
	const startListening = () => {
		if (recognitionRef.current && !isListening) {
			recognitionRef.current.start();
			console.log("Ready to receive voice input.");
		}
	};

	const stopListening = () => {
		if (recognitionRef.current && isListening) {
			recognitionRef.current.stop();
		}
	};

	const toggleVoiceInput = () => {
		if (isListening) {
			stopListening();
		} else {
			startListening();
		}
	};

	// Scroll to bottom on new messages
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const onFormSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim() || isLoading) return;

		// Send message using text: input as per documentation
		sendMessage({ text: input });
		setInput("");
	};

	return (
		<div className="flex flex-col h-full bg-black/50">
			{/* Header */}
			<div className="flex items-center justify-between p-3 border-b border-white/10">
				<div className="flex items-center space-x-2">
					<div className={`w-2 h-2 rounded-full ${isLoading ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
					<span className="text-sm font-medium text-gray-200">Nashik City AI</span>
				</div>
				{messages.length > 0 && (
					<button
						onClick={() => setMessages([])}
						className="p-1.5 rounded-md hover:bg-white/5 text-gray-400 hover:text-gray-200 transition-colors"
						title="Clear chat"
					>
						<Trash2 className="w-4 h-4" />
					</button>
				)}
			</div>

			{/* Messages Area */}
			<div className="flex-1 overflow-y-auto p-4 space-y-4">
				{messages.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full px-6 text-center space-y-6 animate-in fade-in duration-500">
						<div className="p-4 bg-white/5 rounded-full border border-white/10 mb-2 shadow-2xl shadow-blue-500/10">
							<div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 animate-pulse" />
						</div>
						<div className="space-y-2 max-w-xs mx-auto">
							<h3 className="text-lg font-medium text-white">How can I help you today?</h3>
							<p className="text-sm text-gray-400">
								I can analyze crime trends, locate emergency services, and provide city infrastructure insights.
							</p>
						</div>

						<div className="grid gap-2 w-full max-w-sm">
							{[
								"Show me high crime areas in Nashik",
								"Where are the nearest hospitals?",
								"List recent emergency calls details",
								"Identify police stations near Gangapur"
							].map((suggestion, i) => (
								<button
									key={i}
									onClick={() => {
										// Programmatically set input and submit styling visually, 
										// but properly we'd want to call sendMessage directly or set input
										sendMessage({ text: suggestion });
									}}
									className="group text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500/30 transition-all duration-200"
								>
									<p className="text-sm text-gray-300 group-hover:text-blue-200 transition-colors">
										{suggestion}
									</p>
								</button>
							))}
						</div>
					</div>
				) : (
					messages.map((msg) => (
						<div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
							<div
								className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === "user"
									? "bg-blue-600/20 border border-blue-500/30 text-blue-100 rounded-br-none"
									: "bg-white/5 border border-white/10 text-gray-200 rounded-bl-none"
									}`}
							>
								{/* Render Parts strictly from documentation pattern */}
								{msg.parts.map((part, index) => {
									if (part.type === "text") {
										return <p key={index} className="text-sm leading-relaxed whitespace-pre-wrap">{part.text}</p>;
									}
									// Handle Tool Calls (Input)
									if (part.type === "tool-invocation") {
										// Fallback for some versions/types, though V6 usually splits call/result
										const toolName = (part as any).toolInvocation?.toolName || (part as any).toolName;
										return (
											<div key={index} className="mt-2 mb-1 p-2 bg-black/20 rounded text-xs border border-white/5 font-mono text-cyan-400">
												<div className="flex items-center gap-2 opacity-70 mb-1">
													<span className="w-2 h-2 rounded-full bg-cyan-500/50" />
													<span>Using tool: {toolName}</span>
												</div>
												<span className="text-amber-400/80 animate-pulse">Processing...</span>
											</div>
										);
									}
									// Standard V6 Tool Invocation which might be implied? 
									// Actually the AI SDK V6 UIMessage 'parts' are typically 'text', 'tool-invocations' (plural? no), or 'tool-call'.
									// Let's check 'tool-call' which is standard in correct types.
									if (part.type === "tool-call") {
										const toolName = (part as any).toolName;
										return (
											<div key={index} className="mt-2 mb-1 p-2 bg-black/20 rounded text-xs border border-white/5 font-mono text-cyan-400">
												<div className="flex items-center gap-2 opacity-70 mb-1">
													<span className="w-2 h-2 rounded-full bg-cyan-500/50" />
													<span>Using tool: {toolName}</span>
												</div>
												<span className="text-amber-400/80 animate-pulse">Calling...</span>
											</div>
										);
									}
									// Handle Tool Results
									if (part.type === "tool-result") {
										const toolName = (part as any).toolName;
										return (
											<div key={index} className="mt-2 mb-1 p-2 bg-emerald-950/20 rounded text-xs border border-emerald-500/20 font-mono text-emerald-400">
												<div className="flex items-center gap-2 opacity-70 mb-1">
													<span className="w-2 h-2 rounded-full bg-emerald-500/50" />
													<span>Tool Result: {toolName}</span>
												</div>
												<span className="text-emerald-300/80">Received Data</span>
											</div>
										);
									}
									return null;
								})}
							</div>
						</div>
					))
				)}
				<div ref={messagesEndRef} />
			</div>

			{/* Input */}
			<div className="p-3 border-t border-white/10 bg-black/20">
				{/* Voice Error Message */}
				{voiceError && (
					<div className="mb-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-in slide-in-from-bottom duration-300">
						<div className="flex items-start gap-2">
							<svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
							</svg>
							<span>{voiceError}</span>
						</div>
					</div>
				)}

				<form onSubmit={onFormSubmit} className="flex gap-2">
					<input
						className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="Ask about crime, hospitals, or emergency services..."
						disabled={isLoading}
					/>

					{/* Voice Input Button */}
					<button
						type="button"
						onClick={toggleVoiceInput}
						disabled={isLoading || !recognitionRef.current}
						className={`p-2.5 rounded-xl transition-all duration-200 ${isListening
							? "bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/50 animate-pulse"
							: "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 border border-white/10"
							} disabled:opacity-50 disabled:cursor-not-allowed`}
						title={isListening ? "Stop listening" : "Start voice input"}
					>
						{isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
					</button>

					{isLoading ? (
						<button
							type="button"
							onClick={() => stop()}
							className="p-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/50 transition-colors"
						>
							<div className="w-4 h-4 rounded-sm bg-current" />
						</button>
					) : (
						<button
							type="submit"
							disabled={!input.trim()}
							className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							<Send className="w-4 h-4" />
						</button>
					)}
				</form>
			</div>
		</div>
	);
}
