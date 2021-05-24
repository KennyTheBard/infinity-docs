# Database

## Description

For document persistance and account data, we used PostgreSQL.

### Database schema

Database schema has only 2 entities: Users and Documents. This way, we can provide authentication for the clients and persistance for documents.
There is no mechanism for managing access to a document, meaning that once you create a document, anyone with an account can view and edit it.

### Backend

The backend module has 3 mail roles:
* provides authentication methods
* provides methods to create, list and delete documents
* listens to a websocket connection that will be used to aggregate message between viewers of the same document

The first 2 roles are occupied through an REST API build with Express, while the third uses the `ws` library to listen to Websocket connections. This `ws` library is wrapped into an Express wrapper called `express-ws`. This allows us to easily create an enpoint for Websocket connection with our already existing Express router.

### Frontend

The application's frontend is a SPA build with React.js and Typescript.


## Run instructions

In order to run the application you wil need to have the following things installed:
```
   node
   npm
   docker
   docker-compose
```

Firstly, the datasource should be configured in the `.env` file from the `backend` directory. The connection details should be the same used in the `db` directory, in the docker-compose file. Those are already configured by default, but any change should be reflected on the other file as well. In order to start the database, execute the following statements in the terminal:
```bash
   # in db/
   docker-compose up -d
```

Next, you will have to build and start the backend:
```bash
   # in api/
   npm run build
   npm run start-prod
```

For development purposes, the backend can be built in watch mode and run with nodemon:
```bash
   # in api/
   npm run watch
   # in another terminal window
   npm run start
```

Finally, after the backend has been started correctly, you will have to start the front end as well:
```bash
   # in web/
   npm run start
```

