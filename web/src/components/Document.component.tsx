import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import * as H from 'history';


export interface DocumentProps extends RouteComponentProps {
   alert: (message: string) => void;
   history: H.History;
}

export default class DocumentComponent extends React.Component<DocumentProps, any> {
   

   render() {
      return (
         <div>
            
         </div>
      );
   }

}