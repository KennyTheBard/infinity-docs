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

   toUserView(): AccountUserView {
      return {
         username: this.username,
      }
   }
}

export interface AccountUserView {
   username: string;
}

export interface AccountAdminView {
   username: string;
   password: string;
}
