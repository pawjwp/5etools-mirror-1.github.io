const {injectManifest} = require("workbox-build");

injectManifest({
	swSrc: "sw-template.js",
	swDest: "sw.js",
	globDirectory: "/",
	globPatterns: [
		"js/**/*.js",
		"css/**/*.css",
		"*.html",
	],
});