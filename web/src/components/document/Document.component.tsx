import React from 'react';
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

   inputLines: (HTMLInputElement | null)[] = [];

   state: {
      docId?: number;
      name?: string;
      title: string;
      contentLines: string[];
      viewers: string[];
      lineSelected?: number;
      cursorPosition?: number;
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
            console.log(data);
            this.addLine(data.line, data.cursorPosition);
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


   addLine = (index: number, cursorPosition: number | undefined) => {
      this.setState({
         contentLines: [
            ...this.state.contentLines.slice(0, index),
            this.state.contentLines[index].substring(0, cursorPosition),
            this.state.contentLines[index].substring(cursorPosition || 0),
            ...this.state.contentLines.slice(index + 1)
         ],
         lineSelected: index + 1,
         cursorPosition: 0
      });
   }


   removeLine = (index: number) => {
      const previousLineLength = this.state.contentLines[index - 1].length;

      this.setState({
         contentLines: [
            ...this.state.contentLines.slice(0, index - 1),
            this.state.contentLines[index - 1] + this.state.contentLines[index],
            ...this.state.contentLines.slice(index + 1)
         ],
         lineSelected: index - 1,
         cursorPosition: previousLineLength
      });
   }


   changeLine = (index: number, content: string) => {
      this.setState({
         contentLines: [
            ...this.state.contentLines.slice(0, index),
            content,
            ...this.state.contentLines.slice(index + 1)
         ],
      });
   }


   onContentLineChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
      this.changeLine(index, event.target.value);

      const newCursorPosition = this.inputLines[index]?.selectionStart;
      if (newCursorPosition !== null) {
         this.setState({
            cursorPosition: this.inputLines[index]?.selectionStart
         });
      }

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
      if (event.key === 'Backspace' && this.state.cursorPosition !== undefined && this.state.lineSelected !== undefined) {
         if (this.state.cursorPosition === 0 && this.state.lineSelected > 0) {
            event.preventDefault()
            this.removeLine(index);

            this.state.ws?.send(JSON.stringify({
               type: WebsocketEventType.CONTENT_CHANGED,
               data: {
                  type: ContentChangedType.LINE_REMOVED,
                  line: index,
                  cursorPosition: this.state.cursorPosition
               } as ContentChangeData
            } as ContentChangedEvent));

         }

         return;
      }

      if (event.key === 'Enter') {
         this.addLine(index, this.state.cursorPosition);

         this.state.ws?.send(JSON.stringify({
            type: WebsocketEventType.CONTENT_CHANGED,
            data: {
               type: ContentChangedType.LINE_ADDED,
               line: index,
               cursorPosition: this.state.cursorPosition
            } as ContentChangeData
         } as ContentChangedEvent));

         return;
      }

      if (event.key === 'ArrowUp' && this.state.lineSelected !== undefined) {
         event.preventDefault();

         if (this.state.lineSelected > 0) {
            this.setState({
               lineSelected: this.state.lineSelected - 1
            })
         }

         return;
      }

      if (event.key === 'ArrowDown' && this.state.lineSelected !== undefined) {
         event.preventDefault();

         if (this.state.lineSelected < this.state.contentLines.length - 1) {
            this.setState({
               lineSelected: this.state.lineSelected + 1
            })
         }

         return;
      }

      if (event.key === 'ArrowLeft' && this.state.lineSelected !== undefined && this.state.cursorPosition !== undefined
         && this.state.cursorPosition > 0) {
         event.preventDefault();
         this.setState({
            cursorPosition: this.state.cursorPosition - 1
         })

         return;
      }

      if (event.key === 'ArrowRight' && this.state.lineSelected !== undefined && this.state.cursorPosition !== undefined
         && this.state.cursorPosition < this.state.contentLines[this.state.lineSelected].length) {
         event.preventDefault();
         this.setState({
            cursorPosition: this.state.cursorPosition + 1
         })

         return;
      }
   }

   onContentLineClick = (index: number, event: React.MouseEvent<HTMLInputElement, MouseEvent>) => {
      this.setState({
         lineSelected: index,
         cursorPosition: this.inputLines[index]?.selectionStart
      })
   }


   render() {
      this.inputLines = this.state.contentLines.map(() => null);

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

            <p>line {this.state.lineSelected}</p>
            <p>pos {this.state.cursorPosition}</p>

            <div className="content">
               {this.state.contentLines?.map((line, index) =>
                  <div className={'content-line ' + (index === this.state.lineSelected ? 'line-selected' : '')}>
                     <span className="content-line index">
                        {index}
                     </span>

                     <input key={index} type="text" value={line} className="content-line"
                        ref={input => {
                           if (input && index === this.state.lineSelected) {
                              input.focus();

                              // bind cursor position to selection range
                              if (this.state.cursorPosition !== undefined && input.value.length < this.state.cursorPosition) {
                                 this.setState({
                                    cursorPosition: input.value.length
                                 });

                                 input.selectionStart = input.value.length;
                                 input.selectionEnd = input.value.length;
                              } else {
                                 input.selectionStart = this.state.cursorPosition || 0;
                                 input.selectionEnd = this.state.cursorPosition || 0;
                              }
                           }

                           this.inputLines[index] = input;
                        }}
                        onInput={(event: React.ChangeEvent<HTMLInputElement>) =>
                           this.onContentLineChange(index, event)
                        }
                        onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) =>
                           this.onContentLineKeyDown(index, event)
                        }
                        onClick={(event: React.MouseEvent<HTMLInputElement>) =>
                           this.onContentLineClick(index, event)
                        }
                     />

                     <br />
                  </div>
               )}
            </div>
         </div>
      );
   }

}