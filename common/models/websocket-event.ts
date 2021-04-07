export enum WebsocketEventType {
   VIEWER_CONNECTED,
   VIEWER_DISCONNECTED,
   CONTENT_CHANGED,
   ERROR
}

export interface WebsocketEvent {
   type: WebsocketEventType;
   data: any;
}
