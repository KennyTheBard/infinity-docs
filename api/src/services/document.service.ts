import { Connection, Repository } from 'typeorm';
import { Document, DocumentUserView } from '../models/entities/document.entity';
import { PaginationFilter } from '../models/pagination';

export class DocumentService {

   private readonly documentRepository: Repository<Document>;

   constructor(
      db: Connection
   ) {
      this.documentRepository = db.getRepository(Document);
   }

   create = async (dto: DocumentUserView) => {
      const document = this.documentRepository.create(dto);

      return (await this.documentRepository.insert(document)).generatedMaps[0];
   }

   getById = async (id: number): Promise<Document> => {
      return await this.documentRepository.findOneOrFail({
         id
      });
   }

   getPreview = async (pagination: PaginationFilter): Promise<[DocumentUserView[], number]> => {
      return await this.documentRepository.createQueryBuilder('document')
         .select(['document.id', 'document.title', 'document.createdAt', 'document.updatedAt'])
         .skip(pagination.page * pagination.size)
         .limit(pagination.size)
         .getManyAndCount();
   }

   update = async (id: number, dto: DocumentUserView) => {
      const document = await this.getById(id);

      document.title = dto.title;
      document.content = dto.content;

      this.documentRepository.save(document);
   }

   delete = async (id: number) => {
      await this.documentRepository.delete(id);
   }

}
