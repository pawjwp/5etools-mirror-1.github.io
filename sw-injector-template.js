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

// below here is dragons, display ui for caching state

/**
 * ask the service worker to runtime cache files that match an array of regex
 * @param {RegExp[]} routes the route matches to cache based on
 */
const swCacheRoutes = (routes) => {
	wb.messageSW({
		type: "CACHE_ROUTES",
		payload: routes,
	});
	JqueryUtil.doToast("warming up to cache!");
};

// icky global but no bundler, so no other good choice
globalThis.swCacheRoutes = swCacheRoutes;

/*
if (NavBar._downloadBarMeta) {
			if (NavBar._downloadBarMeta) {
				NavBar._downloadBarMeta.$wrpOuter.remove();
				NavBar._downloadBarMeta = null;
			}
			sendMessage({type: "cache-cancel"});
		}

		const $dispProgress = $(`<div class="page__disp-download-progress-bar"/>`);
		const $dispPct = $(`<div class="page__disp-download-progress-text ve-flex-vh-center bold">0%</div>`);

		const $btnCancel = $(`<button class="btn btn-default"><span class="glyphicon glyphicon-remove"></span></button>`)
			.click(() => {
				if (NavBar._downloadBarMeta) {
					NavBar._downloadBarMeta.$wrpOuter.remove();
					NavBar._downloadBarMeta = null;
				}
				sendMessage({type: "cache-cancel"});
			});

		const $wrpBar = $$`<div class="page__wrp-download-bar w-100 relative mr-2">${$dispProgress}${$dispPct}</div>`;
		const $wrpOuter = $$`<div class="page__wrp-download">
			${$wrpBar}
			${$btnCancel}
		</div>`.appendTo(document.body);

		NavBar._downloadBarMeta = {$wrpOuter, $wrpBar, $dispProgress, $dispPct};

		// Trigger the service worker to cache everything
		messageChannel.port1.onmessage = e => {
			const msg = e.data;
			switch (msg.type) {
				case "download-continue": {
					if (!NavBar._downloadBarMeta) return;

					sendMessage({type: "cache-continue", data: {index: msg.data.index}});

					break;
				}
				case "download-progress": {
					if (!NavBar._downloadBarMeta) return;

					NavBar._downloadBarMeta.$dispProgress.css("width", msg.data.pct);
					NavBar._downloadBarMeta.$dispPct.text(msg.data.pct);

					break;
				}
				case "download-cancelled": {
					if (!NavBar._downloadBarMeta) return;

					NavBar._downloadBarMeta.$wrpOuter.remove();
					NavBar._downloadBarMeta = null;

					break;
				}
				case "download-error": {
					setTimeout(() => { throw new Error(msg.message); });

					if (!NavBar._downloadBarMeta) return;

					NavBar._downloadBarMeta.$wrpBar.addClass("page__wrp-download-bar--error");
					NavBar._downloadBarMeta.$dispProgress.addClass("page__disp-download-progress-bar--error");
					NavBar._downloadBarMeta.$dispPct.text("Error!");

					JqueryUtil.doToast(`An error occurred. ${VeCt.STR_SEE_CONSOLE}`);

					break;
				}
			}
		};
		*/