import { Workbox } from "workbox-window/Workbox.mjs";

// throwing an uncaught error ends execution of this script.
if (!("serviceWorker" in navigator)) throw new Error("no serviceWorker in navigator, no sw will be injected");

const throttle = (func, delay) => {
	let timeout = null;
	return function (...args) {
		if (timeout === null) {
			func.apply(this, args);
			timeout = setTimeout(() => { timeout = null; }, delay);
		}
	};
};

const fetchError = {
	"generic": throttle(() => {
		JqueryUtil.doToast({
			content: `Failing to fetch some generic content - you are offline and have not viewed this content before. Unexpected behavior may occur.`,
			type: "warning", // options are warning, info, danger, success
			autoHideTime: 2_500 /* 2.5 seconds */,
		});
	}, 10_000 /* 10 seconds */),

	"json": throttle(() => {
		JqueryUtil.doToast({
			content: `Failing to fetch data - you are offline and have not viewed this content before. This page is likely to fail to load or behave strangely.`,
			type: "danger", // options are warning, info, danger, success
			autoHideTime: 9_000 /* 9 seconds */,
		});
	}, 2_000 /* 2 seconds */),

	"image": throttle(() => {
		JqueryUtil.doToast({
			content: `Failing to fetch images - you are offline and have not viewed this content before. Pages should load, but some images may be substituted for placeholders.`,
			type: "info", // options are warning, info, danger, success
			autoHideTime: 5_000 /* 5 seconds */,
		});
	}, 60_000 /* 60 seconds */),
};

const wb = new Workbox("sw.js");

wb.addEventListener("controlling", () => {
	JqueryUtil.doToast({
		content: `${window.location.hostname} has been updated - reload this page to see new content or fix transition issues`,
		type: "success", // options are warning, info, danger, success
		autoHideTime: 0, // never auto hide - this warning is important
	});
});

wb.addEventListener("message", event => {
	const msg = event.data;
	switch (msg.type) {
		case "FETCH_ERROR":
			fetchError[msg.payload]();
			break;
		default:
	}
});

// this is where we tell the service worker to start - after the page has loaded
// event listeners need to be added first
wb.register();

setTimeout(() => {
	wb.messageSW({
		type: "CACHE_ROUTES",
		payload: [/test/],
	});
}, 1500);