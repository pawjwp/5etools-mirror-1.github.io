/* eslint-disable no-console */

import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, Strategy, StrategyHandler } from "workbox-strategies";

import { generateURLVariations } from "workbox-precaching/utils/generateURLVariations";
import { createCacheKey } from "workbox-precaching/utils/createCacheKey";

// nabbed from https://github.com/GoogleChrome/workbox/blob/0cc6975f17b60d67a71d8b717e73ef7ddb79a891/packages/workbox-core/src/_private/waitUntil.ts#L19-L26
/**
 * wait until an event happens
 * @param {ExtendableEvent} event event to wait until on
 * @param {() => Promise<any>} asyncFn the function to pass to waitUntil
 * @returns {Promise<any>}
 */
function waitUntil (
	event,
	asyncFn,
) {
	const returnPromise = asyncFn();
	event.waitUntil(returnPromise);
	return returnPromise;
}

/*
routes take precedence in order listed. if a higher route and a lower route both match a file, the higher route will resolve it
https://stackoverflow.com/questions/52423473/workbox-routing-registerroute-idempotence
*/

// the self value is replaced with key: value pair of file: hash, to allow workbox to carry files over between caches if they match
// precacheAndRoute(self.__WB_PRECACHE_MANIFEST);

class RevisionCacheFirst extends Strategy {
	constructor () {
		super({ cacheName: "runtime-revision" });

		// bind this for activate method
		this.activate = this.activate.bind(this);
	}

	/**
   * @param {Request} request
   * @param {StrategyHandler} handler
   * @returns {Promise<Response | undefined>}
   */
	async _handle (request, handler) {
		/** the full url of the request, https://example.com/slug/ */
		const url = request.url;
		/**
		 * the route of the url, with a query string for the revision
		 *
		 * this way, we can invalidate the cache entry if the revision is wrong
		 */
		const cacheKey = createCacheKey({url, revision: runtimeManifest.get(url)}).cacheKey;

		const cacheResponse = await handler.cacheMatch(cacheKey);
		// undefined is returned if we don't have a cache response for the key
		if (cacheResponse !== undefined) return cacheResponse;

		// we need to fetch the request from the network and store it with revision for next time
		console.log(`fetching ${url} over the network for RevisionFirstCache`);
		try {
			const fetchResponse = await handler.fetch(request);
			await handler.cachePut(cacheKey, fetchResponse.clone());
			return fetchResponse;
		} catch (e) {
			return null;
		}
	}

	/**
	 * the cache busting portion of the Strategy.
	 * Iterate the cache, and remove anything that is not in the manifest, or from a different revision.
	 *
	 * call this from the activate event
	 *
	 * @param {ExtendableEvent} event
	 * @returns {Promise}
	 */
	activate (event) {
		return waitUntil(event, async () => {
			const cache = await caches.open(this.cacheName);

			const currentCacheKeys = (await cache.keys()).map(request => request.url);
			const validCacheKeys = new Set(Array.from(runtimeManifest).map(([url, revision]) => createCacheKey({url, revision}).cacheKey));

			// queue up all the deletions
			await Promise.allSettled(
				currentCacheKeys.map(async key => {
				// this will happen if a revision is updated or a file is no longer included in the glob
					if (!validCacheKeys.has(key)) {
						// we can save space by deleting this element - it wouldn't be served bc the revision is wrong
						console.log(`deleting ${key} from the cache because its revision does not match`);
						await cache.delete(key);
					}
				}),
			);
		});
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

console.log(runtimeManifest);

const revisionCacheFirst = new RevisionCacheFirst();

registerRoute(
	({request}) => runtimeManifest.has(request.url),
	revisionCacheFirst,
);

// purge the old entries from cache
addEventListener("activate", revisionCacheFirst.activate);

/*
this tells workbox to cache fonts, and serve them cache first after first load
this works on the assumption that fonts are static assets and won't change
 */
registerRoute(({request}) => request.destination === "font", new CacheFirst());
