import { DocumentService } from './services/document.service';
import * as dotenv from 'dotenv';
import express from 'express';
import { Document } from './entities/document.entity';
import cors from 'cors';
import { InstanceManager } from './util/instance-manager';
import { ErrorHandlerMiddleware } from './middleware';
import { createConnection } from 'typeorm';
import { DocumentController } from './controllers/document.controller';

const init = async () => {
   try {
      // load environment vars
      dotenv.config();

      // connect to PostgreSQL database
      const db = await createConnection({
         type: 'postgres',
         host: process.env.POSTGRES_HOST,
         port: +process.env.POSTGRES_PORT,
         username: process.env.POSTGRES_USERNAME,
         password: process.env.POSTGRES_PASSWORD,
         database: process.env.POSTGRES_DB,
         synchronize: true,
         logging: process.env.ENABLE_DB_DEBUG === 'true',
         entities: [
            Document
         ]
      });

      // init app with an websocket server
      const app = express();

      // init services
      InstanceManager.register(new DocumentService(db));

      // init middleware
      // InstanceManager.register(middleware instance);

      // add middleware
      app.use(express.json());
      app.use(cors());
      app.use(new ErrorHandlerMiddleware().use);

      // init controllers
      [
         new DocumentController()
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