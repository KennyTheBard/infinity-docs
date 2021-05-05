import moment from 'moment';
import {
   Entity,
   PrimaryGeneratedColumn,
   Column,
   BeforeInsert,
   BeforeUpdate
} from 'typeorm';


@Entity()
export class Document {

   @PrimaryGeneratedColumn()
   id: number;

   @Column()
   title: string;

   @Column()
   content: string;

   @Column({
      name: 'created_at'
   })
   createdAt: number;

   @Column({
      name: 'updated_at'
   })
   updatedAt: number;

   @BeforeInsert()
   generateTimestamps = () => {
     this.createdAt = moment().unix();
     this.updatedAt = moment().unix();
   };

   @BeforeUpdate()
   generateUpdatedAt = () => {
     this.updatedAt = moment().unix();
   };

   toUserView(): DocumentUserView {
      return {
         title: this.title,
         content: this.content,
         createdAt: this.createdAt,
         updatedAt: this.updatedAt
      }
   }
}

export interface DocumentUserView {
   title: string;
   content: string;
   createdAt?: number;
   updatedAt?: number
}
