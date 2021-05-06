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
      const username = localStorage.getItem('username');
      if (username === null) {
         this.props.history.push('/auth');
      }

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
            this.props.alert(`[${err.response.status} ${err.response.statusText}] ${err.response.data}`)
         );
   }

   newDocument = (title?: string, content?: string) => {
      axios.post(`${config.HTTP_SERVER_URL}/document`, {
         title: title || 'Untitled document',
         content: content || ''
      })
         .then((res) =>
            this.props.history.push(`/edit/${res.data.id}`)
         ).catch((err) =>
            this.props.alert(`[${err.response.status} ${err.response.statusText}] ${err.response.data}`)
         )
   }

   uploadDocument = async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files === null || event.target.files?.length === 0) {
         return;
      }
      var f = event.target.files[0];

      if (f) {
         var r = new FileReader();
         r.onload = (e) => {
            if (e.target != null) {
               var contents = e.target.result as string;
               this.newDocument(f.name, contents)
            }
         }
         r.readAsText(f);
      }
   }

   editDocument = (docId: number) => {
      this.props.history.push(`/edit/${docId}`)
   }

   deleteDocument = (docId: number) => {
      axios.delete(`${config.HTTP_SERVER_URL}/document/${docId}`)
         .then((res) =>
            this.loadDocuments()
         ).catch((err) =>
            this.props.alert(`[${err.response.status} ${err.response.statusText}] ${err.response.data}`)
         )
   }

   formatDate = (timestamp: number): string => {
      const timestampMoment = moment.unix(timestamp);
      const daysSince = moment().diff(timestampMoment, 'hours');

      if (daysSince < 12) {
         return timestampMoment.format('h:mm:ss a');
      } else if (daysSince < 7 * 24) {
         return timestampMoment.format('dddd');
      } else {
         return timestampMoment.format('Do [of] MMMM YYYY');
      }
   }

   render() {
      let fileInputRef: HTMLInputElement | null = null;

      return (
         <div className="home-container">
            <div className="home-actions">
               <button onClick={() => this.newDocument()}>
                  New
               </button>
               <button onClick={() => fileInputRef?.click()}>
                  Upload
               </button>
               <button onClick={() => {
                  localStorage.removeItem('username');
                  window.location.reload();
               }}>
                  Logout
               </button>
               <input type="file" id="myFile" name="filename"
                  style={{ visibility: 'hidden' }}
                  ref={input => fileInputRef = input}
                  onChange={this.uploadDocument}
               />
            </div>

            <div className="documents">
               <div className="documents-header">
                  <div className="document-title">
                     Title
                  </div>
                  <div>
                     Created at
                  </div>
                  <div>
                     Last updated at
                  </div>
                  <div>
                     Actions
                  </div>
               </div>
               {this.state.documents.map(d =>
                  <div key={d.id} className="document-preview">
                     <div className="document-title">
                        {d.title.substring(0, 25) + (d.title.length > 25 ? '...' : '')}
                     </div>
                     <div>
                        {this.formatDate(d.createdAt)}
                     </div>
                     <div>
                        {this.formatDate(d.updatedAt)}
                     </div>
                     <div className="actions">
                        {/* Place those in reverse order */}
                        <button onClick={() => this.deleteDocument(d.id)}>
                           Delete
                        </button>
                        <button onClick={() => this.editDocument(d.id)}>
                           Edit
                        </button>
                     </div>
                  </div>
               )}
            </div>

         </div>
      );
   }

}