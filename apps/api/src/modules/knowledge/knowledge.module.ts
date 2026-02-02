import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiModule } from '../ai/ai.module';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeChunk, KnowledgeChunkSchema } from './schemas/knowledge-chunk.schema';

@Module({
  imports: [
    AiModule,
    MongooseModule.forFeature([
      { name: KnowledgeChunk.name, schema: KnowledgeChunkSchema },
    ]),
  ],
  controllers: [KnowledgeController],
  providers: [KnowledgeService],
  exports: [KnowledgeService],
})
export class KnowledgeModule { }
