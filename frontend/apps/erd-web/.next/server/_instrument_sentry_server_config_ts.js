"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "_instrument_sentry_server_config_ts";
exports.ids = ["_instrument_sentry_server_config_ts"];
exports.modules = {

/***/ "(instrument)/./sentry.server.config.ts":
/*!*********************************!*\
  !*** ./sentry.server.config.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _sentry_nextjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @sentry/nextjs */ \"(instrument)/../../../node_modules/.pnpm/@sentry+nextjs@8.55.0_@opentelemetry+context-async-hooks@1.30.1_@opentelemetry+core@1.30.1_@o_z3s5mh66mawwnoh5pw4lqv5chy/node_modules/@sentry/nextjs/build/cjs/index.server.js\");\n/* harmony import */ var _sentry_nextjs__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_sentry_nextjs__WEBPACK_IMPORTED_MODULE_0__);\n// This file configures the initialization of Sentry on the server.\n// The config you add here will be used whenever the server handles a request.\n// https://docs.sentry.io/platforms/javascript/guides/nextjs/\n\n_sentry_nextjs__WEBPACK_IMPORTED_MODULE_0__.init({\n    dsn: process.env.SENTRY_DSN,\n    // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.\n    tracesSampleRate: 1,\n    // Setting this option to true will print useful information to the console while you're setting up Sentry.\n    debug: false,\n    environment: \"development\"\n});\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGluc3RydW1lbnQpLy4vc2VudHJ5LnNlcnZlci5jb25maWcudHMiLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbUVBQW1FO0FBQ25FLDhFQUE4RTtBQUM5RSw2REFBNkQ7QUFFckI7QUFFeENBLGdEQUFXLENBQUM7SUFDVkUsS0FBS0MsUUFBUUMsR0FBRyxDQUFDQyxVQUFVO0lBRTNCLG1IQUFtSDtJQUNuSEMsa0JBQWtCO0lBRWxCLDJHQUEyRztJQUMzR0MsT0FBTztJQUVQQyxhQUFhTCxhQUFnQztBQUMvQyIsInNvdXJjZXMiOlsiL1VzZXJzL3ByYWtoYXIvRG9jdW1lbnRzL29wZW5zX3NvdXJjZV9jb250cmlidXRpb25fMi9saWFtL2Zyb250ZW5kL2FwcHMvZXJkLXdlYi9zZW50cnkuc2VydmVyLmNvbmZpZy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBUaGlzIGZpbGUgY29uZmlndXJlcyB0aGUgaW5pdGlhbGl6YXRpb24gb2YgU2VudHJ5IG9uIHRoZSBzZXJ2ZXIuXG4vLyBUaGUgY29uZmlnIHlvdSBhZGQgaGVyZSB3aWxsIGJlIHVzZWQgd2hlbmV2ZXIgdGhlIHNlcnZlciBoYW5kbGVzIGEgcmVxdWVzdC5cbi8vIGh0dHBzOi8vZG9jcy5zZW50cnkuaW8vcGxhdGZvcm1zL2phdmFzY3JpcHQvZ3VpZGVzL25leHRqcy9cblxuaW1wb3J0ICogYXMgU2VudHJ5IGZyb20gJ0BzZW50cnkvbmV4dGpzJ1xuXG5TZW50cnkuaW5pdCh7XG4gIGRzbjogcHJvY2Vzcy5lbnYuU0VOVFJZX0RTTixcblxuICAvLyBEZWZpbmUgaG93IGxpa2VseSB0cmFjZXMgYXJlIHNhbXBsZWQuIEFkanVzdCB0aGlzIHZhbHVlIGluIHByb2R1Y3Rpb24sIG9yIHVzZSB0cmFjZXNTYW1wbGVyIGZvciBncmVhdGVyIGNvbnRyb2wuXG4gIHRyYWNlc1NhbXBsZVJhdGU6IDEsXG5cbiAgLy8gU2V0dGluZyB0aGlzIG9wdGlvbiB0byB0cnVlIHdpbGwgcHJpbnQgdXNlZnVsIGluZm9ybWF0aW9uIHRvIHRoZSBjb25zb2xlIHdoaWxlIHlvdSdyZSBzZXR0aW5nIHVwIFNlbnRyeS5cbiAgZGVidWc6IGZhbHNlLFxuXG4gIGVudmlyb25tZW50OiBwcm9jZXNzLmVudi5ORVhUX1BVQkxJQ19FTlZfTkFNRSxcbn0pXG4iXSwibmFtZXMiOlsiU2VudHJ5IiwiaW5pdCIsImRzbiIsInByb2Nlc3MiLCJlbnYiLCJTRU5UUllfRFNOIiwidHJhY2VzU2FtcGxlUmF0ZSIsImRlYnVnIiwiZW52aXJvbm1lbnQiLCJORVhUX1BVQkxJQ19FTlZfTkFNRSJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(instrument)/./sentry.server.config.ts\n");

/***/ })

};
;