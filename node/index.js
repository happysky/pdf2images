import path from 'path'
import express from 'express'
import ejs from 'ejs'
import multer from 'multer'
import serveIndex from 'serve-index'
import * as morgan from './morgan.js'
import logger from './logger.js'
import { ROOT_PATH } from './config.js'
import controllerHome  from './controllers/home.js'
import controllerConvert from './controllers/convert.js'

const upload = multer();


const app = express()
const port = 3000

// setup access logger
app.use(morgan.accessLog);
// setup error logger
app.use(morgan.errorLog);

// app.use('/static', express.static('static'));
app.use(express.static('static'))

// view engine setup
app.set('views', path.join(ROOT_PATH, 'views'));
ejs.delimiter = '?';
ejs.openDelimiter = '<';
ejs.closeDelimiter = '>';
app.engine('html', ejs.__express);
app.set('view engine', 'html');

app.get("/", controllerHome)
app.post("/convert", upload.single('file'),controllerConvert)


app.listen(port, () => {
    logger.info("Example app listening on port " + port);
})

process.on('uncaughtException', function(err) {
    logger.error(`uncaughtException：${JSON.stringify(err)}`);
});

process.on('unhandledRejection', function(err, promise) {
    logger.error(`unhandledRejection：${err.reason}, ${JSON.stringify(err)}, ${JSON.stringify(promise)}`);
});