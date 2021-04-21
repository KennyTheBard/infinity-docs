import { BrowserRouter, Route, Switch } from 'react-router-dom';
import HomeComponent from './components/home.components';
import DocumentComponent from './components/document.component';
import './App.css';


function App() {
  return (
    <div className="App">
      <header className="App-header">
        <BrowserRouter basename='/'>
          <Switch>
            <Route exact path={'/'} render={(matchProps) =>
              <HomeComponent {...matchProps} />
            } />
            <Route exact path={'/:docId'} render={(matchProps) =>
              <DocumentComponent {...matchProps} />
            } />
          </Switch>
        </BrowserRouter>
      </header>
    </div>
  );
}

export default App;
