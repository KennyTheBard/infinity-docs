import { DocumentService } from './document.service';
import {
   WebsocketEvent,
   WebsocketEventType,
   ErrorEvent,
   ContentChangedEvent,
   ContentChangedType
} from '../models/websocket-event';
import expressWs from 'express-ws';
import * as ws from 'ws';
import * as http from 'http';
import * as url from 'url';
import { v4 as uuid } from 'uuid';

interface DocumentSession {
   content: string[]; // document contents split in lines
   viewers: Viewer[];
}

interface Viewer {
   name: string;
   ws: ws;
}

export class WebsocketService {

   private readonly sessions: Map<number, DocumentSession> = new Map<number, DocumentSession>();


   constructor(
      private readonly router: expressWs.Router,
      private readonly documentService: DocumentService
   ) {
      this.initWebsocketServer();
   }


   initWebsocketServer = () => {
      this.router.ws('/', (ws: ws, req: http.IncomingMessage) => {
         async () => {
            const query = url.parse(req.url, true).query;
            const docId = query.docId as unknown as number;

            if (!docId) {
               ws.close(1011, 'No docId provided or wrong format');
            }

            const viewer = {
               name: uuid(),
               ws
            };

            let docSession = this.sessions.get(docId);
            if (docSession === undefined) {
               docSession = {
                  content: (await this.documentService.getById(docId)).content.split('\n'),
                  viewers: []
               };
            }

            // notify other viewers on this user joining
            docSession.viewers.forEach(v => v.ws.send(
               JSON.stringify({
                  type: WebsocketEventType.VIEWER_CONNECTED,
                  data: {
                     name: viewer.name
                  }
               })
            ));

            docSession.viewers.push(viewer);
            this.sessions.set(docId, docSession);

            ws.on('close', () => {
               const docSession = this.sessions.get(docId);

               // remove this viewer from the session
               docSession.viewers = docSession.viewers.filter(v => v.name !== viewer.name);

               // notify other viewers on this user leave
               docSession.viewers.forEach(v => v.ws.send(
                  JSON.stringify({
                     type: WebsocketEventType.VIEWER_DISCONNECTED,
                     data: {
                        name: viewer.name
                     }
                  })
               ));

               // update sessions
               if (docSession.viewers.length === 0) {
                  this.sessions.delete(docId);
               } else {
                  this.sessions.set(docId, docSession);
               }
            });

            ws.on('message', (data: ws.Data) => {
               this.handleMessage(
                  docId,
                  ws,
                  data as string
               );
            });
         }
      });
   }


   handleMessage = (
      docId: number,
      ws: ws,
      stringifiedMessage: string
   ) => {
      const message = JSON.parse(stringifiedMessage) as WebsocketEvent;

      // check if message is correctly formated
      if (!!message) {
         ws.send(JSON.stringify({
            type: WebsocketEventType.ERROR,
            data: 'Incorrectly formated message'
         }));
         return;
      }

      if ((message as ContentChangedEvent) !== undefined) {
         const ccMsg = message as ContentChangedEvent;
         let line;
         let docSession = this.sessions.get(docId);

         switch (ccMsg.data.type) {
            case ContentChangedType.LINE_ADDED:
               docSession.content = docSession.content.splice(ccMsg.data.line, 0, '');
               break;

            case ContentChangedType.LINE_REMOVED:
               docSession.content = docSession.content.splice(ccMsg.data.line, 1);
               break;

            case ContentChangedType.CHARACTER_ADDED:
               line = docSession.content[ccMsg.data.line];
               docSession.content[ccMsg.data.line] = line.slice(0, ccMsg.data.position) + ccMsg.data.character + line.slice(ccMsg.data.position + 1);
               break;

            case ContentChangedType.CHARACTER_REMOVED:
               line = docSession.content[ccMsg.data.line];
               docSession.content[ccMsg.data.line] = line.slice(0, ccMsg.data.position) + line.slice(ccMsg.data.position + 1);
               break;
         }

         this.sessions.set(docId, docSession);

         docSession.viewers.forEach(v => v.ws.send(
            JSON.stringify(message)
         ));

      } else if ((message as ErrorEvent) !== undefined) {
         // TODO: handle error

      } else {
         // TODO: handle invalid message
      }
   }

}