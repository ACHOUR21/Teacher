"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FlashcardsModule = void 0;
var _common = require("@nestjs/common");
var _database = require("../database/database.module");
var _flashcards = require("./flashcards.service");
var _flashcards2 = require("./presentation/controllers/flashcards.controller");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let FlashcardsModule = exports.FlashcardsModule = class FlashcardsModule {};
exports.FlashcardsModule = FlashcardsModule = __decorate([(0, _common.Module)({
  imports: [_database.DatabaseModule],
  controllers: [_flashcards2.FlashcardsController],
  providers: [_flashcards.FlashcardsService],
  exports: [_flashcards.FlashcardsService]
})], FlashcardsModule);