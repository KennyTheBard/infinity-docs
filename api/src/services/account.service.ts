import { Account, AccountAdminView } from './../models/entities/account.entity';
import { Connection, Repository } from 'typeorm';

export class AccountService {

   private readonly accountRepository: Repository<Account>;

   constructor(
      db: Connection
   ) {
      this.accountRepository = db.getRepository(Account);
   }

   create = async (dto: AccountAdminView) => {
      const account = this.accountRepository.create(dto);

      if (!dto.username || !dto.password) {
         throw new Error('Missing credentials')
      }

      return (await this.accountRepository.insert(account)).generatedMaps[0];
   }

   getByUsername = async (username: string): Promise<Account> => {
      return (await this.accountRepository.findOne({
         username
      }));
   }

}
