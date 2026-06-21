"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NoCache = exports.CacheTTL = void 0;
var _common = require("@nestjs/common");
const CacheTTL = seconds => (0, _common.SetMetadata)('cache_ttl', seconds);
exports.CacheTTL = CacheTTL;
const NoCache = () => (0, _common.SetMetadata)('cache_ttl', 0);
exports.NoCache = NoCache;