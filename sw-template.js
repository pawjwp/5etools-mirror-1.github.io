import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, Strategy, StrategyHandler } from "workbox-strategies";

import { generateURLVariations } from "workbox-precaching/utils/generateURLVariations";
import { createCacheKey } from "workbox-precaching/utils/createCacheKey";

// routes take precedence in order listed. if a higher route and a lower route both match a file, the higher route will resolve it
// https://stackoverflow.com/questions/52423473/workbox-routing-registerroute-idempotence

// the self value is replaced with key: value pair of file: hash, to allow workbox to carry files over between caches if they match
// precacheAndRoute(self.__WB_PRECACHE_MANIFEST);

// this tells workbox to cache fonts, and serve them cache first after first load
// this works on the assumption that fonts are static assets and won't change
registerRoute(({request}) => request === "font", new CacheFirst());

class RevisionCacheFirst extends Strategy {
	constructor () {
		super({ cacheName: "runtime-revision" });
	}

	/**
   * @param {Request} request
   * @param {StrategyHandler} handler
   * @returns {Promise<Response | undefined>}
   */
	async _handle (request, handler) {
		const cacheKey = createCacheKey({url: request.url, revision: 10}).cacheKey;
		console.log(cacheKey);

		const cacheResponse = await handler.cacheMatch(cacheKey);
		console.log(cacheResponse);
		if (cacheResponse !== undefined) return cacheResponse;

		const fetchResponse = await handler.fetch(request);
		await handler.cachePut(cacheKey, fetchResponse.clone());
		return fetchResponse;
	}
}

/**
 * __WB_RUNTIME_MANIFEST is injected as [url, revision] map to be constructed as Map
 */
const runtimeManifest = new Map(self.__WB_RUNTIME_MANIFEST);
// this is... not awesome, but it should be highly performant after the up front cost
const runtimeRevisionUrls = new Set(Array.from(runtimeManifest.keys())
	.map((route) => `${self.location.origin}/${route}`));

registerRoute(
	({request}) => runtimeRevisionUrls.has(request.url),
	new RevisionCacheFirst(runtimeManifest),
);
