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
import { InstanceManager } from '../util/instance-manager';
import ReadWriteLock from 'rwlock';
import { DocumentService } from './document.service';

interface DocumentSession {
   title: string;
   content: string[]; // document contents split in lines
   viewers: Viewer[];
}

interface Viewer {
   name: string;
   ws: ws;
}

export class WebsocketService {

   private readonly sessions: Map<number, DocumentSession> = new Map<number, DocumentSession>();
   private readonly updateTimers: Map<number, NodeJS.Timeout> = new Map<number, NodeJS.Timeout>();
   private readonly documentService: DocumentService;
   private readonly documentLock: ReadWriteLock;

   constructor(
      private readonly router: expressWs.Router,
   ) {
      this.documentService = InstanceManager.get(DocumentService);
      this.documentLock = new ReadWriteLock();

      this.initWebsocketServer();
   }

   initWebsocketServer = () => {
      this.router.ws('/', (ws: ws, req: http.IncomingMessage) => {
         const query = url.parse(req.url, true).query;
         const docId = query.docId as unknown as number;
         const viewerName = query.name as unknown as string;

         if (!docId) {
            ws.close(1011, 'No docId provided or wrong format');
         }

         if (!viewerName) {
            ws.close(1011, 'No name provided or wrong format');
         }

         // create new viewer
         const viewer = {
            name: viewerName,
            ws
         };

         // create new session
         let newSession = false;
         let docSession = this.sessions.get(docId);
         if (docSession === undefined) {
            docSession = {
               title: '',
               content: [],
               viewers: []
            };

            newSession = true;
         }
         console.log(this.sessions);

         // notify other viewers on this user joining
         docSession.viewers.forEach(v => this.safeWebsocketSend(
            docId,
            v.ws,
            JSON.stringify({
               type: WebsocketEventType.VIEWER_CONNECTED,
               data: {
                  name: viewer.name
               }
            })
         ));

         // notify this viewer of the viewers already connected
         docSession.viewers.forEach(v => this.safeWebsocketSend(
            docId,
            ws,
            JSON.stringify({
               type: WebsocketEventType.VIEWER_CONNECTED,
               data: {
                  name: v.name
               }
            })
         ));

         // add the new session to the session manager
         docSession.viewers.push(viewer);
         this.sessions.set(docId, docSession);

         // load document content in case it's not already loaded
         if (newSession) {
            this.loadDocumentContent(docId);
         }

         ws.on('close', () => {
            this.handleDisconnect(docId, ws);
         });

         ws.on('message', (data: ws.Data) => {
            this.handleMessage(
               docId,
               ws,
               viewerName,
               data as string
            );
         });
      });
   }

   loadDocumentContent = async (docId: number) => {
      const docSession = this.sessions.get(docId);
      const doc = await this.documentService.getById(docId);
      docSession.content = doc.content.split('\n');
      docSession.title = doc.title;
   }

   safeWebsocketSend = (docId: number, ws: ws, message: string) => {
      try {
         ws.send(message);
      } catch (err) {
         this.handleDisconnect(docId, ws);
      }
   }

   handleDisconnect = (
      docId: number,
      ws: ws
   ) => {
      const docSession = this.sessions.get(docId);

      // remove this viewer from the session
      const disconnectedViewer = docSession.viewers.filter(v => v.ws === ws)[0];
      docSession.viewers = docSession.viewers.filter(v => v.ws !== ws);

      // notify other viewers on this user leave
      docSession.viewers.forEach(v => this.safeWebsocketSend(
         docId,
         v.ws,
         JSON.stringify({
            type: WebsocketEventType.VIEWER_DISCONNECTED,
            data: {
               name: disconnectedViewer.name
            }
         })
      ));
   }

   handleMessage = (
      docId: number,
      ws: ws,
      name: string,
      stringifiedMessage: string
   ) => {
      const message = JSON.parse(stringifiedMessage) as WebsocketEvent;

      // check if message is correctly formated
      if (!message) {
         this.safeWebsocketSend(
            docId,
            ws,
            JSON.stringify({
               type: WebsocketEventType.ERROR,
               data: 'Incorrectly formated message'
            }));
         return;
      }

      if ((message as ContentChangedEvent) !== undefined) {
         const ccMsg = message as ContentChangedEvent;
         let docSession = this.sessions.get(docId);

         // get lock on document
         this.documentLock.writeLock('' + docId, (release) => {
            // cancel database update
            const existingTimer = this.updateTimers.get(docId);
            if (existingTimer !== undefined) {
               clearTimeout(existingTimer);
            }

            switch (ccMsg.data.type) {
               case ContentChangedType.LINE_ADDED:
                  // TODO: Check if the lineIndex exists
                  docSession.content.splice(
                     ccMsg.data.lineIndex,
                     1,
                     docSession.content[ccMsg.data.lineIndex].substring(0, ccMsg.data.cursorPosition || 0),
                     docSession.content[ccMsg.data.lineIndex].substring(ccMsg.data.cursorPosition)
                  );
                  break;

               case ContentChangedType.LINE_REMOVED:
                  // TODO: Check if lineIndex - 1 and lineIndex exist
                  docSession.content.splice(
                     ccMsg.data.lineIndex - 1,
                     2,
                     docSession.content[ccMsg.data.lineIndex - 1] + docSession.content[ccMsg.data.lineIndex]
                  );
                  break;

               case ContentChangedType.LINE_CHANGED:
                  // TODO: Check if the lineIndex exists
                  docSession.content[ccMsg.data.lineIndex] = ccMsg.data.changedContent;
                  break;

               case ContentChangedType.TITLE_CHANGED:
                  docSession.title = ccMsg.data.changedContent;
                  break;
            }

            // set timer to update database
            const timer = setTimeout(() => this.updateDocument(docId), 100);
            this.updateTimers.set(docId, timer);

            // release lock
            release();
         });

         // update the other viewers regarding the content changes
         docSession.viewers.filter(v => v.name !== name)
            .forEach(v => this.safeWebsocketSend(
               docId,
               v.ws,
               JSON.stringify(message)
            ));

      } else if ((message as ErrorEvent) !== undefined) {
         // TODO: handle error

      } else {
         // TODO: handle invalid message
      }
   }

   private updateDocument = async (docId) => {
      const docSession = this.sessions.get(docId);
      if (docSession === undefined) {
         return;
      }
      this.documentService.update(docId, {
         title: docSession.title,
         content: docSession.content.join('\n')
      });
   }

}