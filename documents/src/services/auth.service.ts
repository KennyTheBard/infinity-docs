import axios from 'axios';


export class AuthService {

   constructor(
      private readonly authUrl: string
   ){}

   verify = async (username: string, token: string): Promise<boolean> => {
      const response = await axios.post(`${this.authUrl}/verify`, {username, token});
      return response.data.correct;
   }

}