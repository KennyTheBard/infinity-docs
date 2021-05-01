import React, { Fragment, MutableRefObject } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import * as H from 'history';
import axios from 'axios';
import config from '../../utils/config';
import './Document.scss';
import { useRef } from 'react';
import { createRef } from 'react';

export interface DocumentProps extends RouteComponentProps<{
   docId: string,
}> {
   alert: (message: string) => void;
   history: H.History;
}

export default class DocumentComponent extends React.Component<DocumentProps, any> {

   state: {
      docId?: number;
      title?: string;
      contentLines?: string[];
   } = {}

   componentDidMount() {
      this.setState({
         docId: parseInt(this.props.match.params.docId)
      }, () => this.loadDocument());
   }


   loadDocument = () => {
      axios.get(`${config.HTTP_SERVER_URL}/document/${this.state.docId}`)
         .then((res) =>
            this.setState({
               title: res.data.title,
               contentLines: res.data.content.split('\n')
            })
         ).catch((err) =>
            this.props.alert(err.message)
         );
   }


   onContentLineChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
      if (this.state.contentLines === undefined) {
         return;
      }

      this.setState({
         contentLines: [
            ...this.state.contentLines.slice(0, index),
            event.target.value,
            ...this.state.contentLines.slice(index + 1)
         ]
      })

      // TODO: update server-side document about line changed
   }


   onContentLineKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
      if (this.state.contentLines === undefined) {
         return;
      }

      if (event.key === 'Backspace' && this.state.contentLines[index].length === 0) {
         this.setState({
            contentLines: [
               ...this.state.contentLines.slice(0, index),
               ...this.state.contentLines.slice(index + 1)
            ]
         });

         // TODO: update server-side document about line deleted

         return;
      }

      if (event.key === 'Enter') {
         this.setState({
            contentLines: [
               ...this.state.contentLines.slice(0, index +1),
               '',
               ...this.state.contentLines.slice(index + 1)
            ]
         });

         // TODO: update server-side document about line added

         return;
      }
   }


   render() {
      return (
         <div>
            <div className="title">
               {this.state.title}
            </div>

            <div className="content">
               {this.state.contentLines?.map((line, index) =>
                  <Fragment>
                     <input key={index} type="text" className="content-line" value={line}
                        onInput={(event: React.ChangeEvent<HTMLInputElement>) => this.onContentLineChange(index, event)}
                        onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => this.onContentLineKeyDown(index, event)} 
                     />
                     <br />
                  </Fragment>
               )}
            </div>
         </div>
      );
   }


}