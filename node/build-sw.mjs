import {injectManifest} from "workbox-build";
import esbuild from "esbuild";
import {writeFile} from "fs/promises";

await writeFile("sw.js", "");

const resp = await injectManifest({
	swSrc: "sw-template.js",
	swDest: "sw.js",
	globDirectory: "/",
	globPatterns: [
		"/js/**/*.js",
		"/css/**/*.css",
		"*.html",
	],
});

console.log(resp);

console.log("manifest injected");

await esbuild.build({
	entryPoints: ["sw.js"],
	bundle: true,
	allowOverwrite: true,
	outfile: "sw.js",
});

console.log("esbuild bundled");