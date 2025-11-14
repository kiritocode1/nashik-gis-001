import { pipeline, env } from "@huggingface/transformers";
import type { ProgressInfo, AutomaticSpeechRecognitionPipeline, TextGenerationPipeline } from "@huggingface/transformers";

env.allowLocalModels = false;

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

class VoxtralSingleton {
	static sttModel = "Xenova/whisper-base";
	static chatModel = "onnx-community/Qwen2.5-0.5B-Instruct-ONNX";
	static sttPipeline: AutomaticSpeechRecognitionPipeline | null = null;
	static chatPipeline: TextGenerationPipeline | null = null;
	static isInitialized = false;

	static async initialize(progressCallback?: (progressInfo: ProgressInfo) => void): Promise<void> {
		if (this.isInitialized) return;

		try {
			const progress = (info: ProgressInfo) => {
				if (progressCallback) {
					progressCallback(info);
				}
				const progressValue = typeof info === "object" && "progress" in info ? (info.progress as number) : 0;
				self.postMessage({
					status: "initiate",
					progress: progressValue,
				} as WorkerResponse);
			};

			self.postMessage({
				status: "initiate",
				progress: 0.1,
			} as WorkerResponse);

			const sttResult = await pipeline("automatic-speech-recognition", this.sttModel, {
				progress_callback: progress,
			});
			this.sttPipeline = sttResult as AutomaticSpeechRecognitionPipeline;

			self.postMessage({
				status: "initiate",
				progress: 0.5,
			} as WorkerResponse);

			const chatResult = await pipeline("text-generation", this.chatModel, {
				progress_callback: progress,
			});
			this.chatPipeline = chatResult as TextGenerationPipeline;

			this.isInitialized = true;
			self.postMessage({
				status: "ready",
			} as WorkerResponse);
		} catch (error) {
			self.postMessage({
				status: "error",
				error: error instanceof Error ? error.message : "Failed to initialize models",
			} as WorkerResponse);
			throw error;
		}
	}

	static async converse(audio: Float32Array, sampleRate: number, conversationHistory: ConversationMessage[]): Promise<{ transcription: string; response: string }> {
		if (!this.sttPipeline || !this.chatPipeline) {
			throw new Error("Model not initialized");
		}

		const sttResult = await this.sttPipeline(audio, {
			return_timestamps: false,
		});
		const transcription = (sttResult as { text: string }).text;

		const conversationText = conversationHistory.map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`).join("\n");

		const prompt = conversationText ? `${conversationText}\nUser: ${transcription}\nAssistant:` : `User: ${transcription}\nAssistant:`;

		const chatResult = await this.chatPipeline(prompt, {
			max_new_tokens: 128,
			temperature: 0.7,
		});

		const chatOutput = chatResult as { generated_text?: string } | { generated_text?: string }[];
		const generatedText = Array.isArray(chatOutput) ? chatOutput[0]?.generated_text || "" : chatOutput.generated_text || "";
		const response = generatedText.split("Assistant:")[generatedText.split("Assistant:").length - 1]?.trim() || "";

		return { transcription, response };
	}
}

self.addEventListener("message", async (event: MessageEvent<WorkerMessage>) => {
	try {
		if (event.data.type === "init") {
			const timeout = setTimeout(() => {
				self.postMessage({
					status: "error",
					error: "Model loading timeout. Please refresh the page.",
				} as WorkerResponse);
			}, 300000);

			try {
				await VoxtralSingleton.initialize((progressInfo) => {
					const progress = typeof progressInfo === "object" && "progress" in progressInfo ? (progressInfo.progress as number) : 0;
					self.postMessage({
						status: "initiate",
						progress,
					} as WorkerResponse);
				});
				clearTimeout(timeout);
			} catch (error) {
				clearTimeout(timeout);
				throw error;
			}
		} else if (event.data.type === "converse") {
			if (!event.data.audio || !event.data.sampleRate || event.data.conversationHistory === undefined) {
				throw new Error("Missing required data for conversation");
			}

			const result = await VoxtralSingleton.converse(event.data.audio, event.data.sampleRate, event.data.conversationHistory || []);

			self.postMessage({
				status: "complete",
				transcription: result.transcription,
				response: result.response,
			} as WorkerResponse);
		}
	} catch (error) {
		self.postMessage({
			status: "error",
			error: error instanceof Error ? error.message : "Unknown error",
		} as WorkerResponse);
	}
});
