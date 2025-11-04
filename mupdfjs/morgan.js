import fs from 'fs'
import path from 'path'
import FileStreamRotator from 'file-stream-rotator'
import morgan from 'morgan'
import moment from 'moment'
import { ROOT_PATH } from './config.js'


const logDirectory = path.join(ROOT_PATH, '.log')
const morganFormat = process.env.NODE_ENV !== "production" ? "dev" : "combined";

// ensure log directory exists
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)

// 自定义token
morgan.token('localDate',function getDate(req) {    
    return moment().format('YYYY-MM-DD HH:mm:ss.SSS');
})
   
// 自定义format，其中包含自定义的token
morgan.format('dev', ':remote-addr - :remote-user [:localDate] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"');

morgan.format('combined', ':remote-addr - :remote-user [:localDate] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"');
  

const accessLogStream = FileStreamRotator.getStream({
    date_format: 'YYYYMMDD',
    filename: path.join(logDirectory, 'access-%DATE%.log'),
    frequency: 'daily',
    verbose: false
})
const errorLogStream = FileStreamRotator.getStream({
    date_format: 'YYYYMMDD',
    filename: path.join(logDirectory, 'error-%DATE%.log'),
    frequency: 'daily',
    verbose: false
})

export const accessLog = morgan(morganFormat, {
    skip: function (req, res) {
        return res.statusCode >= 400;
    },
    stream: accessLogStream
})

export const errorLog = morgan(morganFormat, {
    skip: function (req, res) {
        return res.statusCode < 400;
    },
    stream: errorLogStream
})
