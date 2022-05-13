import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, Strategy, StrategyHandler } from "workbox-strategies";

import { generateURLVariations } from "workbox-precaching/utils/generateURLVariations";
import { createCacheKey } from "workbox-precaching/utils/createCacheKey";

/*
routes take precedence in order listed. if a higher route and a lower route both match a file, the higher route will resolve it
https://stackoverflow.com/questions/52423473/workbox-routing-registerroute-idempotence
*/

// the self value is replaced with key: value pair of file: hash, to allow workbox to carry files over between caches if they match
// precacheAndRoute(self.__WB_PRECACHE_MANIFEST);

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
		console.log(request.url);
		console.log(runtimeManifest);
		const cacheKey = createCacheKey({url: request.url, revision: 10}).cacheKey;

		const cacheResponse = await handler.cacheMatch(cacheKey);
		if (cacheResponse !== undefined) return cacheResponse;

		const fetchResponse = await handler.fetch(request);
		await handler.cachePut(cacheKey, fetchResponse.clone());
		return fetchResponse;
	}
}

/**
 * Map([url, revision])
 *
 * __WB_RUNTIME_MANIFEST is injected as [route, revision] array, mapped into [url, revision], and constructed as map
 */
const runtimeManifest = new Map(self.__WB_RUNTIME_MANIFEST.map(
	([
		route,
		revision,
	]) =>
		[
			`${self.location.origin}/${route}`,
			revision,
		],
));

registerRoute(
	({request}) => runtimeManifest.has(request.url),
	new RevisionCacheFirst(runtimeManifest),
);

/*
this tells workbox to cache fonts and external images, and serve them cache first after first load
this works on the assumption that fonts are static assets and won't change
this will catch images not from our origin, as those would be caught by the revision first cache
^^^ it is assumed that external images feature versioning in their url
 */

// a map is more optimal because of v8 turbofan, but it makes for more confusing code
const cacheSet = new Set(["font", "image"]);
registerRoute(({request}) => cacheSet.has(request.destination), new CacheFirst());
