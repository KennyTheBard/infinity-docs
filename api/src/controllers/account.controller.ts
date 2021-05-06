import { Request, Response, Router } from 'express';
import { AccountService } from '../services/account.service';
import { InstanceManager } from '../util/instance-manager';

export class AccountController {

   public path = '/account';
   public router = Router();

   private readonly accountService: AccountService;

   constructor() {
      this.accountService = InstanceManager.get(AccountService);

      this.router.post('/register', this.register);
      this.router.post('/login', this.login);
   }

   /**
    * POST /account/register
    */
   register = async (req: Request, res: Response) => {
      const {
         username, password
      } = req.body;

      try {
         if (await this.accountService.getByUsername(username) !== undefined) {
            throw new Error('Username already taken');
         }

         const result = await this.accountService.create({
            username,
            password
         });

         res.status(201).send(result);
      } catch (err) {
         res.status(401).send(err.message);
      }
   }

   /**
    * POST /account/login
    */
   login = async (req: Request, res: Response) => {
      const {
         username, password
      } = req.body;

      try {
         const result = await this.accountService.getByUsername(username);

         if (result === undefined || result.password !== password) {
            throw new Error('Wrong credentials');
         }

         res.status(201);
      } catch (err) {
         res.status(401).send(err.message);
      }
   }

}