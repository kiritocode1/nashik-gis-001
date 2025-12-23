"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Send, Trash2, Loader2 } from "lucide-react";

interface ConversationMessage {
	role: "user" | "assistant";
	content: string;
}

interface WorkerMessage {
	type: "init" | "converse";
	audio?: Float32Array;
	sampleRate?: number;
	conversationHistory?: ConversationMessage[];
	text?: string;
}

interface WorkerResponse {
	status: "initiate" | "ready" | "complete" | "error";
	transcription?: string;
	response?: string;
	error?: string;
	progress?: number;
}

export default function ChatInterface() {
	const [conversation, setConversation] = useState<ConversationMessage[]>([]);
	const [inputText, setInputText] = useState<string>("");
	const [isRecording, setIsRecording] = useState<boolean>(false);
	const [isProcessing, setIsProcessing] = useState<boolean>(false);
	const [isReady, setIsReady] = useState<boolean>(false);
	const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	const workerRef = useRef<Worker | null>(null);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const audioChunksRef = useRef<Blob[]>([]);
	const streamRef = useRef<MediaStream | null>(null);
	const messagesEndRef = useRef<HTMLDivElement | null>(null);

	// Scroll to bottom when new messages arrive
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [conversation]);

	// Initialize worker
	useEffect(() => {
		if (!workerRef.current) {
			workerRef.current = new Worker(new URL("../app/speech-to-text/worker.ts", import.meta.url), { type: "module" });
		}

		const worker = workerRef.current;

		const handleMessage = (e: MessageEvent<WorkerResponse>) => {
			switch (e.data.status) {
				case "initiate":
					setIsModelLoading(true);
					setIsProcessing(true);
					break;
				case "ready":
					setIsReady(true);
					setIsModelLoading(false);
					setIsProcessing(false);
					break;
				case "complete":
					if (e.data.transcription && e.data.response) {
						// Audio response - add both transcription and response
						setConversation((prev) => [
							...prev,
							{ role: "user", content: e.data.transcription || "" },
							{ role: "assistant", content: e.data.response || "" },
						]);
					} else if (e.data.response && !e.data.transcription) {
						// Text-only response - user message already added, just add assistant response
						setConversation((prev) => [...prev, { role: "assistant", content: e.data.response || "" }]);
					}
					setIsProcessing(false);
					break;
				case "error":
					setError(e.data.error || "Unknown error");
					setIsProcessing(false);
					setIsModelLoading(false);
					break;
			}
		};

		worker.addEventListener("message", handleMessage);
		worker.postMessage({ type: "init" } as WorkerMessage);

		return () => {
			worker.removeEventListener("message", handleMessage);
		};
	}, []);

	const processAudio = useCallback(
		async (audioBlob: Blob) => {
			try {
				const audioContext = new AudioContext({ sampleRate: 16000 });
				const arrayBuffer = await audioBlob.arrayBuffer();
				const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
				const float32Array = audioBuffer.getChannelData(0);

				if (workerRef.current) {
					workerRef.current.postMessage({
						type: "converse",
						audio: float32Array,
						sampleRate: audioContext.sampleRate,
						conversationHistory: conversation,
					} as WorkerMessage);
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to process audio");
				setIsProcessing(false);
			}
		},
		[conversation],
	);

	const processText = useCallback(
		async (text: string) => {
			if (!text.trim() || !workerRef.current || !isReady) return;

			setIsProcessing(true);
			setError(null);

			const userMessage: ConversationMessage = { role: "user", content: text.trim() };
			const updatedConversation = [...conversation, userMessage];

			// Add user message immediately
			setConversation(updatedConversation);
			setInputText("");

			// Send text to worker
			try {
				if (workerRef.current) {
					workerRef.current.postMessage({
						type: "converse",
						text: text.trim(),
						conversationHistory: updatedConversation,
					} as WorkerMessage);
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to send message");
				setIsProcessing(false);
			}
		},
		[conversation, isReady],
	);

	const startRecording = useCallback(async () => {
		try {
			setError(null);
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			streamRef.current = stream;

			const mediaRecorder = new MediaRecorder(stream, {
				mimeType: "audio/webm",
			});
			mediaRecorderRef.current = mediaRecorder;
			audioChunksRef.current = [];

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					audioChunksRef.current.push(event.data);
				}
			};

			mediaRecorder.onstop = async () => {
				if (audioChunksRef.current.length > 0) {
					const audioBlob = new Blob(audioChunksRef.current, {
						type: "audio/webm",
					});
					setIsProcessing(true);
					await processAudio(audioBlob);
				}
			};

			mediaRecorder.start();
			setIsRecording(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to access microphone. Please check permissions.");
		}
	}, [processAudio]);

	const stopRecording = useCallback(() => {
		if (mediaRecorderRef.current && isRecording) {
			mediaRecorderRef.current.stop();
			setIsRecording(false);
		}

		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
		}
	}, [isRecording]);

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			if (inputText.trim() && !isProcessing && isReady) {
				processText(inputText);
			}
		},
		[inputText, isProcessing, isReady, processText],
	);

	const handleToggleRecording = useCallback(() => {
		if (isRecording) {
			stopRecording();
		} else {
			startRecording();
		}
	}, [isRecording, startRecording, stopRecording]);

	return (
		<div className="flex flex-col h-full">
			{/* Chat Header */}
			<div className="flex items-center justify-between p-3 border-b border-border">
				<div className="flex items-center space-x-2">
					<div className="w-2 h-2 rounded-full bg-green-500"></div>
					<span className="text-sm font-medium text-foreground">AI Assistant</span>
					{isModelLoading && (
						<div className="flex items-center space-x-1 text-xs text-muted-foreground">
							<Loader2 className="w-3 h-3 animate-spin" />
							<span>Loading model...</span>
						</div>
					)}
				</div>
				{conversation.length > 0 && (
					<button
						onClick={() => {
							setConversation([]);
							setError(null);
						}}
						className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
						title="Clear chat"
					>
						<Trash2 className="w-4 h-4" />
					</button>
				)}
			</div>

			{/* Messages Area */}
			<div className="flex-1 overflow-y-auto p-4 space-y-3">
				{conversation.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full text-center py-8">
						{isModelLoading ? (
							<>
								<Loader2 className="w-8 h-8 text-muted-foreground animate-spin mb-3" />
								<p className="text-sm text-muted-foreground">Loading AI model...</p>
								<p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
							</>
						) : (
							<>
								<div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
									<svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
									</svg>
								</div>
								<p className="text-sm text-muted-foreground mb-1">Start a conversation</p>
								<p className="text-xs text-muted-foreground">Ask about crime data, emergency calls, CCTV, or police stations</p>
							</>
						)}
					</div>
				) : (
					<>
						{conversation.map((msg, idx) => (
							<div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
								<div
									className={`max-w-[85%] rounded-lg px-3 py-2 ${msg.role === "user"
											? "bg-blue-100 border border-blue-200 text-blue-900"
											: "bg-muted border border-border text-foreground"
										}`}
								>
									<p className="text-xs font-medium mb-1 opacity-70">{msg.role === "user" ? "You" : "Assistant"}</p>
									<p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
								</div>
							</div>
						))}
						{isProcessing && (
							<div className="flex justify-start">
								<div className="bg-muted border border-border rounded-lg px-3 py-2">
									<div className="flex items-center space-x-2">
										<Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
										<span className="text-xs text-muted-foreground">Thinking...</span>
									</div>
								</div>
							</div>
						)}
						<div ref={messagesEndRef} />
					</>
				)}
			</div>

			{/* Error Display */}
			{error && (
				<div className="px-4 py-2 mx-4 mb-2 bg-red-500/10 border border-red-500/30 rounded-md">
					<p className="text-xs text-red-400">{error}</p>
				</div>
			)}

			{/* Input Area */}
			<div className="border-t border-border p-3">
				<form onSubmit={handleSubmit} className="flex items-end space-x-2">
					<div className="flex-1 relative">
						<input
							type="text"
							value={inputText}
							onChange={(e) => setInputText(e.target.value)}
							placeholder={isReady ? "Type your message..." : "Loading model..."}
							disabled={!isReady || isProcessing}
							className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input disabled:opacity-50 disabled:cursor-not-allowed"
						/>
					</div>
					<button
						type="button"
						onClick={handleToggleRecording}
						disabled={isProcessing || !isReady}
						className={`p-2 rounded-lg transition-colors flex-shrink-0 ${isRecording
								? "bg-red-100 border border-red-200 text-red-600 hover:bg-red-200"
								: "bg-muted border border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
							} disabled:opacity-50 disabled:cursor-not-allowed`}
						title={isRecording ? "Stop recording" : "Start voice recording"}
					>
						{isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
					</button>
					<button
						type="submit"
						disabled={!inputText.trim() || isProcessing || !isReady}
						className="p-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
						title="Send message"
					>
						<Send className="w-4 h-4" />
					</button>
				</form>
				{isRecording && (
					<div className="mt-2 flex items-center space-x-2 text-xs text-red-400">
						<div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
						<span>Recording... Click mic to stop</span>
					</div>
				)}
			</div>
		</div>
	);
}

