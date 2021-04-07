import { WebsocketEvent, WebsocketEventType } from './../../../common/models/websocket-event';
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

   private readonly sessions: Map<string, DocumentSession> = new Map<string, DocumentSession>();

   constructor(
      private readonly router: expressWs.Router,
   ) {

      this.router.ws('/', (ws: ws, req: http.IncomingMessage) => {
         async () => {
            const query = url.parse(req.url, true).query;
            const docId = query.docId as string;

            if (!docId) {
               ws.close(1011, 'No docId provided');
            }

            const viewer = {
               name: uuid(),
               ws
            };

            let docSession = this.sessions.get(docId);
            if (docSession === undefined) {
               docSession = {
                  content: [], // TODO: replace with syncronous call to deocument service
                  viewers: []
               };
            }

            docSession.viewers.push(viewer);
            this.sessions.set(docId, docSession);

            ws.on('close', () => {
               const docSession = this.sessions.get(docId);

               // remove this viewer from the session
               docSession.viewers = docSession.viewers.filter(v => v.name !== viewer.name);

               // notify other viewers on this user leave
               docSession.viewers.forEach(v => v.ws.send(
                  JSON.stringify({
                     type: WebsocketEventType.VIEWER_CONNECTED,
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
      docId: string,
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

      // if ((data as QuestionHostMessage).guesserCode !== undefined) {
      //    const guesser = game.players.filter(p => p.code === data.guesserCode)[0];

      //    if (!guesser) {
      //       // TODO: handle this case
      //       console.error('Missing guesser')
      //    }

      //    guesser.ws.send(JSON.stringify({
      //       event: 'question',
      //       objective: 'You are the guesser.',
      //       question: data.text,
      //       options: data.options,
      //    }), (err) => err && console.error(err))

      //    console.log(game.players.map(p => { return { name: p.name, code: p.code } }, guesser))
      //    game.players.filter(p => p.code !== data.guesserCode)
      //       .forEach(p => p.ws.send(
      //          JSON.stringify({
      //             event: 'question',
      //             objective: `Guess what would ${guesser.name} answer to this question?`,
      //             question: data.text,
      //             options: data.options,
      //          }), (err) => err && console.error(err)));
      // } else if ((data as ResultHostMessage).playersAnswers !== undefined) {
      //    game.players.forEach(p => p.ws.send(
      //       JSON.stringify({
      //          ...data,
      //          event: 'result'
      //       }),
      //       (err) => err && console.error(err)
      //    ));
      // }
   }

}