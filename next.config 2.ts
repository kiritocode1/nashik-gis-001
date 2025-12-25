import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
	outputFileTracingRoot: path.join(__dirname),
	webpack: (config) => {
		config.resolve.alias = {
			...config.resolve.alias,
			sharp$: false,
			"onnxruntime-node$": false,
		};
		return config;
	},
	eslint:{
		ignoreDuringBuilds: true,
	},
	typescript:{
		ignoreBuildErrors: true,
	},
};

export default nextConfig;
