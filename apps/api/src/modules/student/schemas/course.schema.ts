import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CourseDocument = Course & Document;

@Schema({ timestamps: true })
export class Course {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  thumbnail?: string;

  @Prop({ required: true })
  totalLessons: number;

  @Prop({ required: true })
  category: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: 0 })
  durationMinutes: number;
}

export const CourseSchema = SchemaFactory.createForClass(Course);
