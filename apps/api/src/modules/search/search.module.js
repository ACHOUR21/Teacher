"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SearchModule = void 0;
var _common = require("@nestjs/common");
var _config = require("@nestjs/config");
var _elasticsearch = require("@nestjs/elasticsearch");
var _search = require("./presentation/controllers/search.controller");
var _search2 = require("./search.service");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let SearchModule = exports.SearchModule = class SearchModule {};
exports.SearchModule = SearchModule = __decorate([(0, _common.Global)(), (0, _common.Module)({
  imports: [_elasticsearch.ElasticsearchModule.registerAsync({
    imports: [_config.ConfigModule],
    useFactory: config => ({
      node: config.get('ELASTICSEARCH_URL', 'http://localhost:9200'),
      auth: config.get('ELASTICSEARCH_USERNAME') ? {
        username: config.get('ELASTICSEARCH_USERNAME', ''),
        password: config.get('ELASTICSEARCH_PASSWORD', '')
      } : undefined
    }),
    inject: [_config.ConfigService]
  })],
  controllers: [_search.SearchController],
  providers: [_search2.SearchService],
  exports: [_search2.SearchService]
})], SearchModule);