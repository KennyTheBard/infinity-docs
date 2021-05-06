import React, { Fragment } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import * as H from 'history';
import axios from 'axios';
import config from '../../utils/config';
import './Auth.scss';


export interface AuthProps extends RouteComponentProps {
   alert: (message: string) => void;
   history: H.History;
}

export default class AuthComponent extends React.Component<AuthProps, any> {

   state: {
      login: boolean;
      username?: string;
      password?: string;
      retypePassword?: string;
   } = {
         login: true
      }

   componentDidMount() {
      const username = localStorage.getItem('username');
      if (username !== null) {
         this.props.history.push('/');
      }
   }


   login = () => {
      if (!this.state.username || !this.state.password) {
         this.props.alert('Incomplete credentials')
         return;
      }

      axios.post(`${config.HTTP_SERVER_URL}/account/login`, {
         username: this.state.username,
         password: this.state.password
      })
         .then((res) => {
            localStorage.setItem('username', this.state.username || '');
            window.location.reload();
         }).catch((err) =>
            this.props.alert(`[${err.response.status} ${err.response.statusText}] ${err.response.data}`)
         );
   }


   register = () => {
      if (!this.state.username || !this.state.password) {
         this.props.alert('Incomplete credentials');
         return;
      }

      if (this.state.password !== this.state.retypePassword) {
         this.props.alert('Passwords not matching');
         return;
      }

      axios.post(`${config.HTTP_SERVER_URL}/account/register`, {
         username: this.state.username,
         password: this.state.password
      })
         .then((res) =>
            this.setState({
               login: true,
               username: '',
               password: '',
               retypePassword: ''
            })
         ).catch((err) =>
            this.props.alert(`[${err.response.status} ${err.response.statusText}] ${err.response.data}`)
         );
   }


   render() {
      return (
         <div className="auth-container">
            <div className="auth-box">
               <div className="auth-header">
                  {this.state.login ? 'Login' : 'Register'}
               </div>

               <div className="auth-body">
                  {this.state.login ?
                     <div className="login">
                        <input type="text" placeholder="username" value={this.state.username}
                           onChange={(e) => this.setState({
                              username: e.target.value 
                           })} />
                        <input type="password" placeholder="password" value={this.state.password}
                           onChange={(e) => this.setState({
                              password: e.target.value
                           })} />
                     </div>
                     :
                     <div className="register">
                        <input type="text" placeholder="username" value={this.state.username}
                           onChange={(e) => this.setState({
                              username: e.target.value
                           })} />
                        <input type="password" placeholder="password" value={this.state.password}
                           onChange={(e) => this.setState({
                              password: e.target.value
                           })} />
                        <input type="password" placeholder="retype password" value={this.state.retypePassword}
                           onChange={(e) => this.setState({
                              retypePassword: e.target.value
                           })} />
                     </div>
                  }

                  <div className="actions">
                     {this.state.login ?
                        <Fragment>
                           <button onClick={() => this.login()}>
                              Login
                           </button>
                           <a href='/#' onClick={(e) => {
                              e.preventDefault();
                              this.setState({
                                 login: false,
                                 username: '',
                                 password: ''
                              });
                           }}>
                              No account?
                           </a>
                        </Fragment>
                        :
                        <Fragment>
                           <button onClick={() => this.register()}>
                              Register
                           </button>
                           <a href='/#' onClick={(e) => {
                              e.preventDefault();
                              this.setState({
                                 login: true,
                                 username: '',
                                 password: '',
                                 retypePassword: ''
                              });
                           }}>
                              Already have an account?
                           </a>
                        </Fragment>
                     }
                  </div>
               </div>
            </div>
         </div>
      );
   }

}