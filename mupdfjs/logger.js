import moment from 'moment'
import {
    createLogger,
    format,
    transports
} from "winston";
import "winston-daily-rotate-file"

// https://github.com/winstonjs/winston#logging
// { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 }
const level = process.env.LOG_LEVEL || "debug";

function formatParams(info) {
    const {
        timestamp,
        level,
        message,
        ...args
    } = info;
    const ts = moment().format('YYYY-MM-DD HH:mm:ss.SSS');

    return `${ts} ${level}: ${message} ${Object.keys(args).length
    ? JSON.stringify(args, "", "")
    : ""}`;
}

// https://github.com/winstonjs/winston/issues/1135
const developmentFormat = format.combine(
    format.colorize(),
    format.timestamp(),
    format.align(),
    format.printf(formatParams)
);

const productionFormat = format.combine(
    format.timestamp(),
    format.align(),
    format.printf(formatParams)
);

let logger;
var errorTransport = new transports.DailyRotateFile({
    filename: '.log/error-app-%DATE%.log',
    datePattern: 'YYYYMMDD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    level: 'error'
});
var infoTransport = new transports.DailyRotateFile({
    filename: '.log/info-app-%DATE%.log',
    datePattern: 'YYYYMMDD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    level: 'info'
});

if (process.env.NODE_ENV !== "production") {
    logger = createLogger({
        level: level,
        format: developmentFormat,
        transports: [new transports.Console()]
    });

} else {
    logger = createLogger({
        level: level,
        format: productionFormat,
        transports: [
            errorTransport,
            infoTransport                    
        ]
    });
}

export default logger;