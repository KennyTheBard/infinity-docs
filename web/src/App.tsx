import { BrowserRouter, Route, RouteComponentProps, Switch } from 'react-router-dom';
import HomeComponent from './components/Home.components';
import DocumentComponent from './components/Document.component';
import './App.css';
import React from 'react';
import Helmet from 'react-helmet';
import { Alert } from './components/Alert.component';


export default class App extends React.Component {

  state: {
    alerts: string[],
  } = {
      alerts: []
    }

  constructor(props: RouteComponentProps) {
    super(props);

    this.addAlert = this.addAlert.bind(this);
  }

  
  addAlert(message: string) {
    this.setState({
      alerts: [
        ...this.state.alerts,
        message
      ]
    });
    setTimeout(() => {
      this.setState({ alerts: [...this.state.alerts].slice(1) });
    },
      3000
    );
  }


  render() {
    return (
      <div className="App">
        <Helmet>
          <title>KennyDocs</title>
          {/* <link rel="icon" type="image/png" href="dionysia.ico" sizes="16x16" /> */}
        </Helmet>

        {/* Alert manager */}
        {this.state.alerts.map((alertMessage: string) =>
          <Alert message={alertMessage}/>
        )}

        <BrowserRouter basename='/'>
          <Switch>
            <Route exact path={'/'} render={(matchProps) =>
              <HomeComponent {...matchProps} alert={this.addAlert} />
            } />
            <Route exact path={'/:docId'} render={(matchProps) =>
              <DocumentComponent {...matchProps} alert={this.addAlert} />
            } />
          </Switch>
        </BrowserRouter>
      </div>
    );
  }
}