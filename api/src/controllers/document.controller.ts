import { DocumentService } from './../services/document.service';
import { Request, Response, Router } from 'express';
import { InstanceManager } from '../util/instance-manager';
import { DEFAULT_PAGE_SIZE } from '../models/pagination';

export class DocumentController {

   public path = '/document';
   public router = Router();

   private documentService: DocumentService;

   constructor(
   ) {
      this.documentService = InstanceManager.get(DocumentService);

      this.router.post('/', this.createDocument);
      this.router.get('/', this.getDocumentsPreview);
      this.router.get('/:docId', this.getDocument);
      this.router.delete('/:docId', this.deleteDocument);
   }

   /**
    * POST /document
    */
   createDocument = async (req: Request, res: Response) => {
      const {
         title, content
      } = req.body;

      try {
         const result = await this.documentService.create({
            title,
            content
         });

         res.status(201).send(result);
      } catch (err) {
         res.status(401).send(err.message);
      }
   }


   /**
    * GET /document
    */
   getDocumentsPreview = async (req: Request, res: Response) => {
      const paginationFiler = {
         page: req.query['page'] as unknown as number || 0,
         size: req.query['size'] as unknown as number || DEFAULT_PAGE_SIZE
      }

      try {
         const result = await this.documentService.getPreview(paginationFiler);

         res.status(200).send(result[0]);
      } catch (err) {
         res.status(401).send(err.message);
      }
   }

   /**
    * GET /document/:id
    */
   getDocument = async (req: Request, res: Response) => {
      const docId = req.params['docId'] as unknown as string;

      try {
         const result = await this.documentService.getById(+docId);

         res.status(200).send(result);
      } catch (err) {
         res.status(401).send(err.message);
      }
   }

   /**
    * DELETE /document/:id
    */
   deleteDocument = async (req: Request, res: Response) => {
      const docId = req.params['docId'] as unknown as string;

      try {
         const result = await this.documentService.delete(+docId);

         res.status(200).send();
      } catch (err) {
         res.status(401).send(err.message);
      }
   }

}