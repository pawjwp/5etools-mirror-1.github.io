import { precacheAndRoute } from "workbox-precaching";

// the self value is replaced with key: value pair of file: hash, to allow workbox to carry files over between caches if they match
precacheAndRoute(self.__WB_MANIFEST);