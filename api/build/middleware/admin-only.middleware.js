"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminOnlyMiddleware = void 0;
class AdminOnlyMiddleware {
    constructor() {
        this.use = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (!!req.user && req.user.role === 'admin') {
                next();
            }
            else {
                next(new Error('Admin priviledges are necessary for this action'));
            }
        });
    }
}
exports.AdminOnlyMiddleware = AdminOnlyMiddleware;
//# sourceMappingURL=admin-only.middleware.js.map