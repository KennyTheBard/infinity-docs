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
import { Viewer } from '../viewer/Viewer.component';


export interface DocumentProps extends RouteComponentProps<{
   docId: string,
}> {
   alert: (message: string) => void;
   history: H.History;
}

export default class DocumentComponent extends React.Component<DocumentProps, any> {

   inputLines: (HTMLTextAreaElement | null)[] = [];

   state: {
      docId?: number;
      name?: string;
      title: string;
      focusOnTitle: boolean;
      contentLines: string[];
      viewers: string[];
      lineSelected?: number;
      cursorPosition?: number;
      ws?: WebSocket;
   } = {
         title: '',
         focusOnTitle: false,
         contentLines: [],
         viewers: []
      }

   componentDidMount() {
      this.setState({
         name: 'test' + Date.now(),
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
            }, () => this.connectToWebsocket())
         ).catch((err) =>
            this.props.alert(err.message)
         );
   }


   connectToWebsocket = () => {
      const ws = new WebSocket(
         `${config.SOCKET_SERVER_URL}` +
         `?docId=${this.state.docId}&name=${this.state.name}`
      );

      ws.onmessage = (event: MessageEvent) => {
         const message = JSON.parse(event.data) as WebsocketEvent;

         switch (message.type) {
            case WebsocketEventType.VIEWER_CONNECTED:
               this.setState({
                  viewers: [...this.state.viewers.filter(name => name !== message.data.name), message.data.name]
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
            this.addLine(data.lineIndex || 0, data.cursorPosition);
            break;

         case ContentChangedType.LINE_REMOVED:
            this.removeLine(data.lineIndex || 0);
            break;

         case ContentChangedType.LINE_CHANGED:
            this.changeLine(data.lineIndex || 0, data.changedContent || '');
            break;

         case ContentChangedType.TITLE_CHANGED:
            this.setState({
               title: data.changedContent
            });
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


   onContentLineChange = (index: number, event: React.ChangeEvent<HTMLTextAreaElement>) => {
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
            lineIndex: index,
            changedContent: event.target.value
         } as ContentChangeData
      } as ContentChangedEvent));
   }


   onContentLineKeyDown = (index: number, event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Backspace' && this.state.cursorPosition !== undefined && this.state.lineSelected !== undefined) {
         if (this.state.cursorPosition === 0 && this.state.lineSelected > 0) {
            event.preventDefault()
            this.removeLine(index);

            this.state.ws?.send(JSON.stringify({
               type: WebsocketEventType.CONTENT_CHANGED,
               data: {
                  type: ContentChangedType.LINE_REMOVED,
                  lineIndex: index,
                  cursorPosition: this.state.cursorPosition
               } as ContentChangeData
            } as ContentChangedEvent));

         }

         return;
      }

      if (event.key === 'Enter') {
         event.preventDefault();

         this.addLine(index, this.state.cursorPosition);

         this.state.ws?.send(JSON.stringify({
            type: WebsocketEventType.CONTENT_CHANGED,
            data: {
               type: ContentChangedType.LINE_ADDED,
               lineIndex: index,
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

   onContentLineClick = (index: number, event: React.MouseEvent<HTMLTextAreaElement, MouseEvent>) => {
      this.setState({
         lineSelected: index,
         cursorPosition: this.inputLines[index]?.selectionStart
      })
   }


   onTitleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      this.setState({
         title: event.target.value
      });

      this.state.ws?.send(JSON.stringify({
         type: WebsocketEventType.CONTENT_CHANGED,
         data: {
            type: ContentChangedType.TITLE_CHANGED,
            changedContent: event.target.value
         } as ContentChangeData
      } as ContentChangedEvent));
   }


   downloadFile = () => {
      const element = document.createElement("a");
      const file = new Blob([this.state.contentLines.join('\n')], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `${this.state.title.replace(/\W/g, '').substring(0, 30).toLowerCase()}.txt`;
      document.body.appendChild(element);
      element.click();
   }


   render() {
      this.inputLines = this.state.contentLines.map(() => null);

      return (
         <div>
            <div className="viewers">
               {[...this.state.viewers, this.state.name]
                  .map((name, index) => <Viewer key={'viewer' + index} name={name}/>)
               }
            </div>

            <div className="title">
               <textarea value={this.state.title} rows={1} spellCheck={false}
                  onInput={this.onTitleChange}
                  onKeyDown={(event: React.KeyboardEvent<HTMLTextAreaElement>) => {
                     if (event.key === 'Enter') {
                        event.preventDefault();
                     }
                  }}
                  onFocus={() => this.setState({
                     focusOnTitle: true
                  })}
                  onBlur={() => this.setState({
                     focusOnTitle: false
                  })}
               />
            </div>

            <div className="actions">
               <button onClick={() => this.downloadFile()}>
                  Download
               </button>
            </div>
         
            {/* Uncomment for debugging: */}
            {/* <div>
               <p>
                  lineSelected: {this.state.lineSelected}
               </p>
               <p>
                  cursorPosition: {this.state.cursorPosition}
               </p>
            </div> */}

            <div className="content">
               {this.state.contentLines?.map((line, index) =>
                  <div className={'content-line ' + (index === this.state.lineSelected ? 'line-selected' : '')} key={'line' + index}>
                     <span className="content-index">
                        {index}
                     </span>

                     <textarea value={line} rows={1} spellCheck={false}
                        ref={input => {
                           if (input && !this.state.focusOnTitle && index === this.state.lineSelected) {
                              input.focus();

                              // bind cursor position to selection range
                              if (this.state.cursorPosition !== undefined && input.value.length < this.state.cursorPosition) {
                                 this.setState({
                                    cursorPosition: input.value.length
                                 });

                                 input.selectionStart = input.value.length;
                                 // input.selectionEnd = input.value.length; // seems to work fine without this
                              } else {
                                 input.selectionStart = this.state.cursorPosition || 0;
                                 // input.selectionEnd = this.state.cursorPosition || 0; // seems to work fine without this
                              }
                           }

                           this.inputLines[index] = input;
                        }}
                        onInput={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                           this.onContentLineChange(index, event)
                        }
                        onKeyDown={(event: React.KeyboardEvent<HTMLTextAreaElement>) =>
                           this.onContentLineKeyDown(index, event)
                        }
                        onClick={(event: React.MouseEvent<HTMLTextAreaElement>) =>
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