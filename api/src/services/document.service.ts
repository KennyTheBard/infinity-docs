import { Connection, In, Repository } from 'typeorm';
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
      await this.documentRepository.insert(document);
   }

   getById = async (id: number): Promise<Document> => {
      return await this.documentRepository.findOneOrFail({
         id
      });
   }

   get = async (pagination: PaginationFilter): Promise<[DocumentUserView[], number]> => {
      return await this.documentRepository.createQueryBuilder('document')
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

   delete = async (id: string) => {
      await this.documentRepository.delete(id);
   }

}
