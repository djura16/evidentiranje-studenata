"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateAttendancePercentage = calculateAttendancePercentage;
function calculateAttendancePercentage(totalClasses, attendedClasses) {
    if (totalClasses === 0)
        return 0;
    return Math.round((attendedClasses / totalClasses) * 100);
}
//# sourceMappingURL=attendance.utils.js.map