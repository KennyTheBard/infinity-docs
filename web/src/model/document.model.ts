export interface DocumentModel extends DocumentPreviewModel {
   content: string;
}

export interface DocumentPreviewModel {
   id: number;
   title: string;
   created_at: number;
   update_at: number;
}