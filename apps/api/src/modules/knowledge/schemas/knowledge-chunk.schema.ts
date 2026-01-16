import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type KnowledgeChunkDocument = KnowledgeChunk & Document;

@Schema({ timestamps: true })
export class KnowledgeChunk {
  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  courseId: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ type: [Number], required: true })
  embedding: number[];

  @Prop()
  sourceFile: string;

  @Prop()
  chunkIndex: number;

  @Prop({ type: Object })
  metadata: {
    pageNumber?: number;
    section?: string;
    tokenCount?: number;
  };
}

export const KnowledgeChunkSchema = SchemaFactory.createForClass(KnowledgeChunk);
