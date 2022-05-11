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
		"js/**/*.js", // all js needs to be loaded
		"lib/**/*.js", // js in lib needs to be loaded
		"css/**/*.css", // all css needs to be loaded
		"homebrew/**/*.json", // presumably if there is homebrew data it should also be loaded
		// we want to match all data unless its for an adventure
		"data/*.json", // root level data
		"data/**/!(adventure)/*.json", // matches all json in data unless it is a file inside a directory called adventure
		"*.html", // all html pages need to be loaded
		"manifest.webmanifest", // we should make sure we have the manifest, although its not strictly needed...
		// we want to store fonts to make things styled nicely
		"fonts/glyphicons-halflings-regular.woff2",
		"fonts/Convergence-Regular.ttf", // this should be a woff2 but that is its own pr
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