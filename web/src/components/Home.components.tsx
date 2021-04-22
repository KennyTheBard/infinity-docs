import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { DocumentModel } from '../model/document.model';
import * as H from 'history';
import axios from 'axios';
import config from '../utils/config';


export interface HomeProps extends RouteComponentProps {
   alert: (message: string) => void;
   history: H.History;
}

export default class HomeComponent extends React.Component<HomeProps, any> {

   state: {
      documents: DocumentModel[];
      loadingData: boolean;
   } = {
      documents: [],
      loadingData: false
   }

   componentDidMount() {
      this.loadGameRooms();
   }

   loadGameRooms = () => {
      this.setState({
         loadingData: true
      });

      axios.get(`${config.HTTP_SERVER_URL}/document?page=0&size=20`)
         .then((res) =>
            this.setState({
               gameRooms: res.data,
               loadingData: false
            })
         ).catch((err) =>
            this.props.alert(err.message)
         )
   }

   editDocument = (event: React.MouseEvent<HTMLButtonElement>) => {
      
   }
   
   render() {
      return (
         <div>
            <button onClick={() => this.props.history.push('/host')}>
               Edit document
            </button>
         </div>
      );
   }

}