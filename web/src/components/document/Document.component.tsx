import React, { Fragment } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import * as H from 'history';
import axios from 'axios';
import config from '../../utils/config';
import './Document.scss';
import {
   ConnectEvent,
   ContentChangeData,
   ContentChangedEvent,
   ContentChangedType,
   DisconnectEvent,
   WebsocketEvent,
   WebsocketEventType
} from '../../model/websocket-event';


export interface DocumentProps extends RouteComponentProps<{
   docId: string,
}> {
   alert: (message: string) => void;
   history: H.History;
}

export default class DocumentComponent extends React.Component<DocumentProps, any> {

   state: {
      docId?: number;
      name?: string;
      title: string;
      contentLines: string[];
      viewers: string[];
      ws?: WebSocket;
   } = {
         title: '',
         contentLines: [],
         viewers: []
      }

   constructor(props: DocumentProps) {
      super(props);

      this.setState({
         name: 'test' + Date.now()
      });
   }

   componentDidMount() {
      this.setState({
         docId: parseInt(this.props.match.params.docId)
      }, () => this.loadDocument());
   }


   loadDocument = () => {
      if (this.state.docId === undefined) {
         return;
      }

      axios.get(`${config.HTTP_SERVER_URL}/document/${this.state.docId}`)
         .then((res) =>
            this.setState({
               title: res.data.title,
               contentLines: res.data.content.split('\n')
            }, () => this.connectToWebsocket(this.state.docId))
         ).catch((err) =>
            this.props.alert(err.message)
         );
   }


   connectToWebsocket = (docId: number | undefined) => {
      const ws = new WebSocket(
         `${config.SOCKET_SERVER_URL}` +
         `?docId=${docId}`
      );

      ws.onmessage = (event: MessageEvent) => {
         const message = JSON.parse(event.data) as WebsocketEvent;
         console.log(message);

         switch (message.type) {
            case WebsocketEventType.VIEWER_CONNECTED:
               this.setState({
                  viewers: [...this.state.viewers, message.data.name]
               });
               break;

            case WebsocketEventType.VIEWER_DISCONNECTED:
               this.setState({
                  viewers: this.state.viewers.filter(name => name !== message.data.name)
               });
               break;

            case WebsocketEventType.CONTENT_CHANGED:
               this.handleContentChange(message.data as ContentChangeData);
               break;

            case WebsocketEventType.ERROR:
               this.props.alert(message.data)
               break;

            default:
               this.props.alert(event.data)
         }
      }

      ws.onopen = () => {
         ws.send(JSON.stringify({
            type: WebsocketEventType.VIEWER_CONNECTED,
            data: {
               name: this.state.name
            }
         } as ConnectEvent));
      }

      ws.onclose = () => {
         ws.send(JSON.stringify({
            type: WebsocketEventType.VIEWER_DISCONNECTED,
            data: {
               name: this.state.name
            }
         } as DisconnectEvent));
      }

      this.setState({
         ws
      });
   }


   handleContentChange = (data: ContentChangeData) => {
      switch (data.type) {
         case ContentChangedType.LINE_ADDED:
            this.addLine(data.line);
            break;

         case ContentChangedType.LINE_REMOVED:
            this.removeLine(data.line);
            break;

         case ContentChangedType.LINE_CHANGED:
            this.changeLine(data.line, data.lineContent || '');
            break;

         default:
            this.props.alert(JSON.stringify(data))
      }
   }


   addLine = (index: number) => {
      this.setState({
         contentLines: [
            ...this.state.contentLines.slice(0, index + 1),
            '',
            ...this.state.contentLines.slice(index + 1)
         ]
      });
   }


   removeLine = (index: number) => {
      this.setState({
         contentLines: [
            ...this.state.contentLines.slice(0, index),
            ...this.state.contentLines.slice(index + 1)
         ]
      });
   }


   changeLine = (index: number, content: string) => {
      this.setState({
         contentLines: [
            ...this.state.contentLines.slice(0, index),
            content,
            ...this.state.contentLines.slice(index + 1)
         ]
      });
   }


   onContentLineChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
      this.changeLine(index, event.target.value)

      // TODO: update server-side document about line changed
      this.state.ws?.send(JSON.stringify({
         type: WebsocketEventType.CONTENT_CHANGED,
         data: {
            type: ContentChangedType.LINE_CHANGED,
            line: index,
            lineContent: event.target.value
         } as ContentChangeData
      } as ContentChangedEvent));
   }


   onContentLineKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Backspace' && this.state.contentLines[index].length === 0) {
         this.removeLine(index);

         this.state.ws?.send(JSON.stringify({
            type: WebsocketEventType.CONTENT_CHANGED,
            data: {
               type: ContentChangedType.LINE_REMOVED,
               line: index
            } as ContentChangeData
         } as ContentChangedEvent));

         return;
      }

      if (event.key === 'Enter') {
         this.addLine(index);

         this.state.ws?.send(JSON.stringify({
            type: WebsocketEventType.CONTENT_CHANGED,
            data: {
               type: ContentChangedType.LINE_ADDED,
               line: index
            } as ContentChangeData
         } as ContentChangedEvent));

         return;
      }
   }


   render() {
      return (
         <div>
            <div className="viewers">
               Viewers:
               {[...this.state.viewers, this.state.name]
                  .map((name, index) => <span key={index}>{name}</span>)
               }
            </div>

            <div className="title">
               {this.state.title}
            </div>

            <div className="content">
               {this.state.contentLines?.map((line, index) =>
                  <Fragment>
                     <input key={index} type="text" className="content-line" value={line}
                        onInput={(event: React.ChangeEvent<HTMLInputElement>) =>
                           this.onContentLineChange(index, event)
                        }
                        onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) =>
                           this.onContentLineKeyDown(index, event)
                        }
                     />
                     <br />
                  </Fragment>
               )}
            </div>
         </div>
      );
   }

}