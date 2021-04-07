import * as mongoose from 'mongoose';

interface DocumentUserView extends mongoose.Document {
   _id: string;
   name: string;
   content: string;
}

const DocumentSchema = new mongoose.Schema({
   name: {
      type: String,
      required: true
   },
   content: {
      type: String,
      required: true
   }
}, { timestamps: true });

const DocumentModel = mongoose.model<DocumentUserView>('Document', DocumentSchema, 'documents');

export {
   DocumentModel,
   DocumentUserView
}