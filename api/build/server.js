"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const express_1 = __importDefault(require("express"));
const winston_1 = __importDefault(require("winston"));
const express_ws_1 = __importDefault(require("express-ws"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const middleware_1 = require("./middleware");
const init = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // load environment vars
        dotenv.config();
        // configure logger
        const winstonLogger = winston_1.default.createLogger({
            level: 'debug',
            format: winston_1.default.format.combine(winston_1.default.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss',
            }), winston_1.default.format((info) => {
                info.message = `[${info.level.toUpperCase()}] ${info.timestamp} : ${info.message}`;
                return info;
            })()),
            defaultMeta: { service: 'user-service' },
            transports: [
                new winston_1.default.transports.Console({
                    format: winston_1.default.format.printf(info => `${info.message}`)
                }),
            ],
        });
        // connect to mongo database
        yield mongoose_1.default.connect(`${process.env.MPROTOCOL}://${process.env.MUSER}:${process.env.MPASSWORD}@${process.env.MHOST}/${process.env.MDATABASE}?${process.env.MCON_PARAM}`, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        // add custom logger to mongo
        if (process.env.ENABLE_DB_DEBUG === 'true') {
            mongoose_1.default.set('debug', (collectionName, methodName, query, doc) => {
                winstonLogger.log('debug', `\x1B[0;36mMongoose:\x1B[0m: ${collectionName}.${methodName}(${JSON.stringify(query)})\n${JSON.stringify(doc)})`);
            });
        }
        // init app with an websocket server
        const { app } = express_ws_1.default(express_1.default());
        const router = express_1.default.Router();
        app.use('/', router);
        // init services
        // init middleware
        // Ex: InstanceManager.register(middleware instance);
        // add middleware
        app.use(express_1.default.json());
        app.use(cors_1.default());
        app.use(new middleware_1.ErrorHandlerMiddleware().use);
        // init controllers
        [].forEach(controller => app.use(`${controller.path}`, controller.router));
        // start server
        const port = process.env.PORT;
        app.listen(port, () => {
            console.log(`App listening on the port ${port}`);
        });
    }
    catch (err) {
        console.error(err);
    }
});
init();
//# sourceMappingURL=server.js.map