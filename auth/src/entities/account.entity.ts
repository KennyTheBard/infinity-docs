import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';


@Entity({
   name: 'accounts'
})
export class Account {

   @PrimaryGeneratedColumn()
   id: number;

   @Column()
   username: string;

   @Column()
   password: string;

   @Column({
      type: 'text',
      nullable: true,
   })
   token: string;

   toUserView(): AccountUserView {
      return {
         username: this.username,
         token: this.token
      }
   }
}

export interface AccountUserView {
   username: string;
   token: string;
}

export interface AccountAdminView {
   username: string;
   password: string;
   token: string;
}
