export enum WebsocketEventType {
   VIEWER_CONNECTED = 'connected',
   VIEWER_DISCONNECTED = 'diconnected',
   CONTENT_CHANGED = 'changed',
   ERROR = 'error'
}


export interface WebsocketEvent {
   type: WebsocketEventType;
   data: any;
}


export interface ConnectEvent {
   type: WebsocketEventType.VIEWER_CONNECTED;
   data: {
      name: string;
   };
}


export interface DisconnectEvent {
   type: WebsocketEventType.VIEWER_DISCONNECTED;
   data: {
      name: string;
   };
}


export interface ContentChangedEvent {
   type: WebsocketEventType.CONTENT_CHANGED;
   data: ContentChangeData
}



export interface ErrorEvent {
   type: WebsocketEventType.ERROR;
   data: string
}


export enum ContentChangedType {
   LINE_ADDED = 'line_added',
   LINE_REMOVED = 'line_removed',
   LINE_CHANGED = 'line_changed'
}


export interface ContentChangeData {
   type: ContentChangedType,
   line: number,
   cursorPosition?: number,
   lineContent?: string
}

