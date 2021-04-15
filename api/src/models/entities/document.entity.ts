import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';


@Entity()
export class Document {

   @PrimaryGeneratedColumn()
   id: number;

   @Column()
   title: string;

   @Column()
   content: string;

   toUserView(): DocumentUserView {
      return {
         title: this.title,
         content: this.content
      }
   }
}

export interface DocumentUserView {
   title: string;
   content: string;
}
