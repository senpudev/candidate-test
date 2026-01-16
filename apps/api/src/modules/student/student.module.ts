import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { Student, StudentSchema } from './schemas/student.schema';
import { Course, CourseSchema } from './schemas/course.schema';
import { Progress, ProgressSchema } from './schemas/progress.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Student.name, schema: StudentSchema },
      { name: Course.name, schema: CourseSchema },
      { name: Progress.name, schema: ProgressSchema },
    ]),
  ],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}
