import * as dotenv from 'dotenv';
import express from 'express';
import expressWs from 'express-ws';
import cors from 'cors';
import { InstanceManager } from './util/instance-manager';
import { ErrorHandlerMiddleware } from './middleware';
import { WebsocketService } from './services/websocket.service';
import { DocumentService } from './services/document.service';

const init = async () => {
   try {
      // load environment vars
      dotenv.config();

      // init app with an websocket server
      const { app } = expressWs(express());
      const router = express.Router() as expressWs.Router;
      app.use('/', router);

      // init services
      InstanceManager.register(new DocumentService(process.env.DOCUMENTS_URL));
      InstanceManager.register(new WebsocketService(router));

      // init middleware
      // InstanceManager.register(middleware instance);

      // add middleware
      app.use(express.json());
      app.use(cors());
      app.use(new ErrorHandlerMiddleware().use);

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