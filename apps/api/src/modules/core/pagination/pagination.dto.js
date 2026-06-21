"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SortOrder = exports.PaginationDto = void 0;
exports.paginate = paginate;
var _swagger = require("@nestjs/swagger");
var _classTransformer = require("class-transformer");
var _classValidator = require("class-validator");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = void 0 && (void 0).__metadata || function (k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SortOrder;
(function (SortOrder) {
  SortOrder["ASC"] = "asc";
  SortOrder["DESC"] = "desc";
})(SortOrder || (exports.SortOrder = SortOrder = {}));
class PaginationDto {
  page = 1;
  limit = 20;
  search;
  sortBy;
  sortOrder = SortOrder.DESC;
  get skip() {
    return (this.page - 1) * this.limit;
  }
}
exports.PaginationDto = PaginationDto;
__decorate([(0, _swagger.ApiPropertyOptional)({
  default: 1,
  minimum: 1
}), (0, _classValidator.IsOptional)(), (0, _classTransformer.Type)(() => Number), (0, _classValidator.IsInt)(), (0, _classValidator.Min)(1), __metadata("design:type", Number)], PaginationDto.prototype, "page", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)({
  default: 20,
  minimum: 1,
  maximum: 100
}), (0, _classValidator.IsOptional)(), (0, _classTransformer.Type)(() => Number), (0, _classValidator.IsInt)(), (0, _classValidator.Min)(1), (0, _classValidator.Max)(100), __metadata("design:type", Number)], PaginationDto.prototype, "limit", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)(), (0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], PaginationDto.prototype, "search", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)(), (0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], PaginationDto.prototype, "sortBy", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)({
  enum: SortOrder,
  default: SortOrder.DESC
}), (0, _classValidator.IsOptional)(), (0, _classValidator.IsEnum)(SortOrder), __metadata("design:type", String)], PaginationDto.prototype, "sortOrder", void 0);
function paginate(items, total, page, limit) {
  const totalPages = Math.ceil(total / limit);
  return {
    items,
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}