import { AccountService } from './services/account.service';
import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { InstanceManager } from './util/instance-manager';
import { ErrorHandlerMiddleware } from './middleware';
import { createConnection } from 'typeorm';
import { AccountController } from './controllers/account.controller';
import { Account } from './entities/account.entity';

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
            Account
         ]
      });

      // init app with an websocket server
      const app = express();

      // init services
      InstanceManager.register(new AccountService(db));

      // add middleware
      app.use(express.json());
      app.use(cors());
      app.use(new ErrorHandlerMiddleware().use);

      // init controllers
      [
         new AccountController(),
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