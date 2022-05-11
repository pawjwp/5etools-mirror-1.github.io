import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst } from "workbox-strategies";

import {Strategy, StrategyHandler} from "workbox-strategies";

// the self value is replaced with key: value pair of file: hash, to allow workbox to carry files over between caches if they match
precacheAndRoute(self.__WB_MANIFEST);

// this tells workbox to cache any of the selected types, and serve them cache first after first load
// this works on the assumption that fonts are static assets and won't change
const cacheTypes = new Set(["font"]);
registerRoute(({request}) => cacheTypes.has(request.destination), new CacheFirst());

class RevisionCacheFirst extends Strategy {
	/**
   * @param {Request} request
   * @param {StrategyHandler} handler
   * @returns {Promise<Response | undefined>}
   */
	_handle (request, handler) {

	}
}