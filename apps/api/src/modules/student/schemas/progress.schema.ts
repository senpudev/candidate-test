import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProgressDocument = Progress & Document;

@Schema({ timestamps: true })
export class Progress {
  @Prop({ type: Types.ObjectId, ref: 'Student', required: true })
  studentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  courseId: Types.ObjectId;

  @Prop({ default: 0 })
  completedLessons: number;

  @Prop({ default: 0 })
  progressPercentage: number;

  @Prop()
  lastAccessedAt?: Date;

  @Prop({ default: 0 })
  timeSpentMinutes: number;
}

export const ProgressSchema = SchemaFactory.createForClass(Progress);
