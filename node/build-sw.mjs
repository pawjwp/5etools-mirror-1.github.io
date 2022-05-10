import {injectManifest} from "workbox-build";
import esbuild from "esbuild";

/**
 * convert from bytes to mb and label the units
 * @param {number} bytes
 * @returns String of the mb conversion with label
 */
const bytesToMb = (bytes) => `${(bytes / 1e6).toPrecision(3)} mb`;

const buildResultLog = (label, buildResult) => {
	console.log(`\n${label}:`);
	console.log(buildResult);
};

const workboxBuildResult = await injectManifest({
	swSrc: "sw-template.js",
	swDest: "sw.js",
	maximumFileSizeToCacheInBytes: 5 /* mb */ * 1e6,
	globDirectory: "", // use the current directory - run this script from project root.
	globPatterns: [
		"js/**/*.js",
		"css/**/*.css",
		"data/**/*.json",
		"*.html",
	],
});

buildResultLog("workbox manifest injection", {...workboxBuildResult, size: bytesToMb(workboxBuildResult.size)});

const esbuildBuildResult = await esbuild.build({
	entryPoints: ["sw.js"],
	bundle: true,
	minify: true,
	allowOverwrite: true,
	outfile: "sw.js",
});

buildResultLog("esbuild bundling", esbuildBuildResult);