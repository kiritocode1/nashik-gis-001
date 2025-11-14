"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2, Trash2 } from "lucide-react";

interface ConversationMessage {
	role: "user" | "assistant";
	content: string;
}

interface WorkerMessage {
	type: "init" | "converse";
	audio?: Float32Array;
	sampleRate?: number;
	conversationHistory?: ConversationMessage[];
}

interface WorkerResponse {
	status: "initiate" | "ready" | "complete" | "error";
	transcription?: string;
	response?: string;
	error?: string;
	progress?: number;
}

export default function SpeechToTextPage() {
	const [conversation, setConversation] = useState<ConversationMessage[]>([]);
	const [isRecording, setIsRecording] = useState<boolean>(false);
	const [isProcessing, setIsProcessing] = useState<boolean>(false);
	const [isReady, setIsReady] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [progress, setProgress] = useState<number>(0);

	const workerRef = useRef<Worker | null>(null);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const audioChunksRef = useRef<Blob[]>([]);
	const streamRef = useRef<MediaStream | null>(null);

	useEffect(() => {
		if (!workerRef.current) {
			workerRef.current = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
		}

		const worker = workerRef.current;

		const handleMessage = (e: MessageEvent<WorkerResponse>) => {
			console.log("Worker message:", e.data);
			switch (e.data.status) {
				case "initiate":
					setIsProcessing(true);
					if (e.data.progress !== undefined) {
						setProgress(e.data.progress);
					}
					break;
				case "ready":
					setIsReady(true);
					setIsProcessing(false);
					setProgress(1);
					console.log("Models loaded successfully");
					break;
				case "complete":
					if (e.data.transcription && e.data.response) {
						setConversation((prev) => [...prev, { role: "user", content: e.data.transcription || "" }, { role: "assistant", content: e.data.response || "" }]);
					}
					setIsProcessing(false);
					break;
				case "error":
					console.error("Worker error:", e.data.error);
					setError(e.data.error || "Unknown error");
					setIsProcessing(false);
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

	const handleToggleRecording = useCallback(() => {
		if (isRecording) {
			stopRecording();
		} else {
			startRecording();
		}
	}, [isRecording, startRecording, stopRecording]);

	return (
		<div className="container mx-auto p-8 max-w-4xl">
			<div className="flex items-center justify-between mb-8">
				<div>
					<h1 className="text-4xl font-bold mb-2">Voice Conversation</h1>
					<p className="text-muted-foreground">Using Voxtral model for speech-to-text and conversation</p>
				</div>
				{conversation.length > 0 && (
					<Button
						onClick={() => setConversation([])}
						variant="outline"
						size="sm"
						className="flex items-center gap-2"
					>
						<Trash2 className="h-4 w-4" />
						Clear Chat
					</Button>
				)}
			</div>

			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Button
						onClick={handleToggleRecording}
						disabled={isProcessing || !isReady}
						size="lg"
						variant={isRecording ? "destructive" : "default"}
						className="flex items-center gap-2"
					>
						{isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
						{isProcessing ? "Processing..." : isRecording ? "Stop Recording" : "Start Recording"}
					</Button>

					{isProcessing && progress > 0 && (
						<div className="flex-1">
							<div className="text-sm text-muted-foreground mb-1">{isReady ? "Processing..." : `Loading model: ${Math.round(progress * 100)}%`}</div>
							<div className="w-full bg-secondary rounded-full h-2">
								<div
									className="bg-primary h-2 rounded-full transition-all"
									style={{ width: `${progress * 100}%` }}
								/>
							</div>
						</div>
					)}
				</div>

				{error && (
					<div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
						<p className="text-destructive text-sm">{error}</p>
					</div>
				)}

				<div className="space-y-2">
					<label className="text-sm font-medium">Conversation:</label>
					<div className="min-h-[400px] max-h-[600px] overflow-y-auto p-4 border rounded-md bg-muted/50 space-y-4">
						{conversation.length === 0 ? (
							<p className="text-muted-foreground text-center py-8">{isReady ? "Click &apos;Start Recording&apos; to begin a conversation..." : "Loading Voxtral model..."}</p>
						) : (
							conversation.map((msg, idx) => (
								<div
									key={idx}
									className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
								>
									<div className={`max-w-[80%] rounded-lg p-3 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
										<p className="text-sm font-medium mb-1">{msg.role === "user" ? "You" : "Assistant"}</p>
										<p className="whitespace-pre-wrap">{msg.content}</p>
									</div>
								</div>
							))
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
