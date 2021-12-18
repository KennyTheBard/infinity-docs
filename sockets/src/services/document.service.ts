import { Document } from './../models/document';
import axios from 'axios';

export class DocumentService {

   constructor(
      private readonly documentsUrl: string
   ) {}

   public getById = async (docId: number): Promise<Document> => {
      return await axios.get(`${this.documentsUrl}/${docId}`);
   }

   public update = async (docId: number, document: Partial<Document>): Promise<void> => {
      try {
         await axios.put(`${this.documentsUrl}/${docId}`, document);
      } catch (e) {
         console.log(e);
      }
   }

}