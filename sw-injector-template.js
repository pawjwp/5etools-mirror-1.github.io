import { Workbox } from "workbox-window/Workbox.mjs";

// throwing an uncaught error ends execution of this script.
if (!("serviceWorker" in navigator)) throw new Error("no serviceWorker in navigator, no sw will be injected");

const wb = new Workbox("sw.js");

wb.addEventListener("controlling", () => {
	JqueryUtil.doToast({
		content: `${window.location.hostname} has been updated - reload if anything seems wrong`,
		type: "success", // options are warning, info, danger, success
	});
});

// this is where we tell the service worker to start - after the page has loaded
// event listeners need to be added first
wb.register();