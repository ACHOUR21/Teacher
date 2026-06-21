"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SchoolErpModule = void 0;
var _common = require("@nestjs/common");
var _cache = require("../cache/cache.module");
var _database = require("../database/database.module");
var _attendanceManagement = require("./attendance-management.service");
var _gradebook = require("./gradebook.service");
var _schoolErp = require("./presentation/controllers/school-erp.controller");
var _schoolErp2 = require("./school-erp.service");
var _timetable = require("./timetable.service");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let SchoolErpModule = exports.SchoolErpModule = class SchoolErpModule {};
exports.SchoolErpModule = SchoolErpModule = __decorate([(0, _common.Module)({
  imports: [_database.DatabaseModule, _cache.CacheModule],
  controllers: [_schoolErp.SchoolErpController],
  providers: [_schoolErp2.SchoolErpService, _timetable.TimetableService, _gradebook.GradeBookService, _attendanceManagement.AttendanceManagementService],
  exports: [_schoolErp2.SchoolErpService, _timetable.TimetableService, _gradebook.GradeBookService, _attendanceManagement.AttendanceManagementService]
})], SchoolErpModule);