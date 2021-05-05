import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { DocumentPreviewModel } from '../../model/document.model';
import * as H from 'history';
import axios from 'axios';
import config from '../../utils/config';
import moment from 'moment';
import './Home.scss';


export interface HomeProps extends RouteComponentProps {
   alert: (message: string) => void;
   history: H.History;
}

export default class HomeComponent extends React.Component<HomeProps, any> {

   state: {
      documents: DocumentPreviewModel[];
      loadingData: boolean;
   } = {
         documents: [],
         loadingData: false
      }

   componentDidMount() {
      this.loadDocuments();
   }

   loadDocuments = () => {
      this.setState({
         loadingData: true
      });

      axios.get(`${config.HTTP_SERVER_URL}/document?page=0&size=20`)
         .then((res) =>
            this.setState({
               documents: res.data,
               loadingData: false
            })
         ).catch((err) =>
            this.props.alert(err.message)
         );
   }

   newDocument = (event: React.MouseEvent<HTMLButtonElement>) => {
      axios.post(`${config.HTTP_SERVER_URL}/document`, {
         title: 'Untitled document',
         content: 'This\nis\na\ntest'
      })
         .then((res) =>
            this.props.history.push(`/${res.data.id}`)
         ).catch((err) =>
            this.props.alert(err.message)
         )
   }

   editDocument = (docId: number) => {
      this.props.history.push(`/${docId}`)
   }

   deleteDocument = (docId: number) => {
      axios.delete(`${config.HTTP_SERVER_URL}/document/${docId}`)
         .then((res) =>
            this.loadDocuments()
         ).catch((err) =>
            this.props.alert(err.message)
         )
   }

   formatDate = (timestamp: number): string => {
      const timestampMoment = moment(timestamp);
      const daysSince = moment().diff(timestampMoment, 'days');

      if (daysSince < 1) {
         return timestampMoment.format('h:mm:ss a');
      } else if (daysSince < 7) {
         return timestampMoment.format('dddd');
      } else {
         return timestampMoment.format('Do [of] MMMM YYYY');
      }
   }

   render() {
      return (
         <div>
            <div className="actions">
               <button onClick={this.newDocument}>
                  New document
               </button>
            </div>

            <div className="documents">
               {this.state.documents.map(d =>
                  <div key={d.id} className="document-preview">
                     <span>
                        {d.title}
                     </span>
                     <span>
                        {this.formatDate(d.created_at)}
                     </span>
                     <span>
                        {this.formatDate(d.update_at)}
                     </span>
                     <span>
                        <button onClick={() => this.editDocument(d.id)}>
                           Edit
                        </button>
                        <button onClick={() => this.deleteDocument(d.id)}>
                           Delete
                        </button>
                     </span>
                  </div>
               )}
            </div>

         </div>
      );
   }

}