import React from 'react';


export default class HomeComponent extends React.Component {
   EditDocument = (event: React.MouseEvent<HTMLButtonElement>) => {
      
   }
   

   render() {
      return (
         <div>
            <button onClick={this.EditDocument}>
               Edit document
            </button>
         </div>
      );
   }

}