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

const fetchError = throttle(() => {
	JqueryUtil.doToast({
		content: `Failing to fetch some content - you are offline and have not viewed this content before`,
		type: "warning", // options are warning, info, danger, success
		autoHideTime: 2_500,
	});
}, 600_000 /* 10 minutes */);

const wb = new Workbox("sw.js");

wb.addEventListener("controlling", () => {
	JqueryUtil.doToast({
		content: `${window.location.hostname} has been updated - reload to see new content or fix transition issues`,
		type: "success", // options are warning, info, danger, success
		autoHideTime: 0,
	});
});

wb.addEventListener("message", event => {
	switch (event.data.type) {
		case "FETCH_ERROR":
			fetchError();
			break;
		default:
	}
});

// this is where we tell the service worker to start - after the page has loaded
// event listeners need to be added first
wb.register();