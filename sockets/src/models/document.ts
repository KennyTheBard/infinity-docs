import moment from 'moment';


export interface Document {
   id: number;
   title: string;
   content: string;
   createdAt: number;
   updatedAt: number;
}