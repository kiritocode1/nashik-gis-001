"use client";

import { useChat } from "@ai-sdk/react";

import { Mic, MicOff, Send, Trash2, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function ChatInterface() {

	const { messages, sendMessage, setMessages, status, error, stop } = useChat();

	const isLoading = status === "streaming" || status === "submitted";

	const messagesEndRef = useRef<HTMLDivElement | null>(null);

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

	// 1. Define local input state
	const [input, setInput] = useState("");

	return (
		<div className="flex flex-col h-full bg-slate-950/50">
			{/* Header */}
			<div className="flex items-center justify-between p-3 border-b border-white/10">
				<div className="flex items-center space-x-2">
					<div className={`w-2 h-2 rounded-full ${isLoading ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
					<span className="text-sm font-medium text-slate-200">Nashik City AI</span>
				</div>
				{messages.length > 0 && (
					<button
						onClick={() => setMessages([])}
						className="p-1.5 rounded-md hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors"
						title="Clear chat"
					>
						<Trash2 className="w-4 h-4" />
					</button>
				)}
			</div>

			{/* Messages Area */}
			<div className="flex-1 overflow-y-auto p-4 space-y-4">
				{messages.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full text-center opacity-50">
						<p className="text-sm text-slate-300">Ask about Nashik city data...</p>
					</div>
				) : (
					messages.map((msg) => (
						<div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
							<div
								className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === "user"
									? "bg-blue-600/20 border border-blue-500/30 text-blue-100 rounded-br-none"
									: "bg-white/5 border border-white/10 text-slate-200 rounded-bl-none"
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
				<form onSubmit={onFormSubmit} className="flex gap-2">
					<input
						className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="Ask about crime, hospitals, or emergency services..."
						disabled={isLoading}
					/>
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
