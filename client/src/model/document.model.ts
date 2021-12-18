export interface DocumentModel extends DocumentPreviewModel {
   content: string;
}

export interface DocumentPreviewModel {
   id: number;
   title: string;
   createdAt: number;
   updatedAt: number;
}