"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = require("../services/logger");
const errorHandler = (err, req, res, next) => {
    logger_1.logger.error('Error occurred:', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        statusCode: err.statusCode
    });
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(statusCode).json({
        error: true,
        message,
        statusCode,
        timestamp: new Date().toISOString(),
        path: req.path
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map