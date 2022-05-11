import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, Strategy, StrategyHandler } from "workbox-strategies";

import { generateURLVariations } from "workbox-precaching/utils/generateURLVariations";
import { createCacheKey } from "workbox-precaching/utils/createCacheKey";

// the self value is replaced with key: value pair of file: hash, to allow workbox to carry files over between caches if they match
// precacheAndRoute(self.__WB_PRECACHE_MANIFEST);

// this tells workbox to cache any of the selected types, and serve them cache first after first load
// this works on the assumption that fonts are static assets and won't change
const cacheTypes = new Set(["font"]);
registerRoute(({request}) => cacheTypes.has(request.destination), new CacheFirst());

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

registerRoute(({request}) => {
	console.log({request, has: runtimeManifest.has(request.url)});
	return runtimeManifest.has(request.url);
}, new RevisionCacheFirst(runtimeManifest));