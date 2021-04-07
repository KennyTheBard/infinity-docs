import * as dotenv from 'dotenv';
import express from 'express';
import winston from 'winston';
import expressWs from 'express-ws';
import cors from 'cors';
import mongoose from 'mongoose';
import { InstanceManager } from './util/instance-manager';
import { ErrorHandlerMiddleware } from './middleware';

const init = async () => {
   try {
      // load environment vars
      dotenv.config();

      // configure logger
      const winstonLogger = winston.createLogger({
         level: 'debug',
         format: winston.format.combine(
            winston.format.timestamp({
               format: 'YYYY-MM-DD HH:mm:ss',
            }),
            winston.format((info) => {
               info.message = `[${(info.level as string).toUpperCase()}] ${info.timestamp} : ${info.message}`;

               return info;
            })(),
         ),
         defaultMeta: { service: 'user-service' },
         transports: [
            new winston.transports.Console({
               format: winston.format.printf(info => `${info.message}`)
            }),
         ],
      });

      // connect to mongo database
      await mongoose.connect(
         `${process.env.MPROTOCOL}://${process.env.MUSER}:${process.env.MPASSWORD}@${process.env.MHOST}/${process.env.MDATABASE}?${process.env.MCON_PARAM}`,
         {
            useNewUrlParser: true,
            useUnifiedTopology: true
         }
      );

      // add custom logger to mongo
      if (process.env.ENABLE_DB_DEBUG === 'true') {
         mongoose.set('debug', (collectionName, methodName, query, doc) => {
            winstonLogger.log('debug', `\x1B[0;36mMongoose:\x1B[0m: ${collectionName}.${methodName}(${JSON.stringify(query)})\n${JSON.stringify(doc)})`)
         });
      }

      // init app with an websocket server
      const { app } = expressWs(express());
      const router = express.Router() as expressWs.Router;
      app.use('/', router);

      // init services


      // init middleware
      // Ex: InstanceManager.register(middleware instance);

      // add middleware
      app.use(express.json());
      app.use(cors());
      app.use(new ErrorHandlerMiddleware().use);

      // init controllers
      [

      ].forEach(controller => app.use(`${controller.path}`, controller.router))

      // start server
      const port = process.env.PORT;
      app.listen(port, () => {
         console.log(`App listening on the port ${port}`);
      });
   } catch (err) {
      console.error(err);
   }
};

init();