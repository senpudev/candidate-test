import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DetailedStats, GetDetailedStatsAggregationResult } from '@candidate-test/shared';
import { Student, StudentDocument } from './schemas/student.schema';
import { Course, CourseDocument } from './schemas/course.schema';
import { Progress, ProgressDocument } from './schemas/progress.schema';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Injectable()
export class StudentService {
  constructor(
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Progress.name) private progressModel: Model<ProgressDocument>
  ) {}

  /**
   * ✅ IMPLEMENTADO - Obtiene los datos del dashboard
   */
  async getDashboard(studentId: string) {
    const student = await this.studentModel.findById(studentId).lean();
    if (!student) return null;

    const progressRecords = await this.progressModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .lean();

    const totalCourses = progressRecords.length;
    const completedCourses = progressRecords.filter(
      (p) => p.progressPercentage === 100
    ).length;
    const inProgressCourses = progressRecords.filter(
      (p) => p.progressPercentage > 0 && p.progressPercentage < 100
    ).length;
    const totalTimeSpent = progressRecords.reduce(
      (acc, p) => acc + (p.timeSpentMinutes || 0),
      0
    );

    // Obtener cursos recientes (últimos 3 accedidos)
    const recentProgress = await this.progressModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .sort({ lastAccessedAt: -1 })
      .limit(3)
      .populate('courseId')
      .lean();

    const recentCourses = recentProgress.map((p) => ({
      course: p.courseId,
      progress: p.progressPercentage,
      lastAccessed: p.lastAccessedAt,
    }));

    return {
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        avatar: student.avatar,
        preferences: student.preferences,
      },
      stats: {
        totalCourses,
        completedCourses,
        inProgressCourses,
        totalTimeSpentMinutes: totalTimeSpent,
        totalTimeSpentFormatted: this.formatTime(totalTimeSpent),
      },
      recentCourses,
    };
  }

  /**
   * ✅ IMPLEMENTADO - Obtiene cursos con progreso
   */
  async getCoursesWithProgress(studentId: string) {
    const courses = await this.courseModel.find().lean();
    const progressRecords = await this.progressModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .lean();

    const progressMap = new Map(
      progressRecords.map((p) => [p.courseId.toString(), p])
    );

    return courses.map((course) => {
      const progress = progressMap.get(course._id.toString());
      return {
        ...course,
        progress: progress
          ? {
            completedLessons: progress.completedLessons,
            progressPercentage: progress.progressPercentage,
            lastAccessedAt: progress.lastAccessedAt,
            timeSpentMinutes: progress.timeSpentMinutes,
          }
          : null,
      };
    });
  }

  // ✅ Estadísticas detalladas con aggregation pipeline de MongoDB.
  async getDetailedStats(studentId: string): Promise<DetailedStats> {
    const objectId = new Types.ObjectId(studentId);

    const collection = this.progressModel.collection;
    const results = await collection
      .aggregate<GetDetailedStatsAggregationResult>([
        { $match: { studentId: objectId } },
        {
          $lookup: {
            from: 'courses',
            localField: 'courseId',
            foreignField: '_id',
            as: 'courseDoc',
          },
        },
        { $unwind: { path: '$courseDoc', preserveNullAndEmptyArrays: true } },
        {
          $facet: {
            main: [
              {
                $group: {
                  _id: null,
                  totalTimeMinutes: {
                    $sum: { $ifNull: ['$timeSpentMinutes', 0] },
                  },
                  completed: {
                    $sum: {
                      $cond: [{ $eq: ['$progressPercentage', 100] }, 1, 0],
                    },
                  },
                  inProgress: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            { $gt: ['$progressPercentage', 0] },
                            { $lt: ['$progressPercentage', 100] },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  avgProgress: { $avg: '$progressPercentage' },
                  dates: {
                    $addToSet: {
                      $cond: [
                        { $ne: ['$lastAccessedAt', null] },
                        {
                          $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$lastAccessedAt',
                          },
                        },
                        null,
                      ],
                    },
                  },
                },
              },
            ],
            byCategory: [
              {
                $group: {
                  _id: {
                    $ifNull: ['$courseDoc.category', 'Sin categoría'],
                  },
                  totalMinutes: {
                    $sum: { $ifNull: ['$timeSpentMinutes', 0] },
                  },
                },
              },
            ],
          },
        },
      ])
      .toArray();

    const facet = results[0];
    const main = facet?.main?.[0];
    const byCategory = facet?.byCategory ?? [];

    const totalTimeMinutes = main?.totalTimeMinutes ?? 0;
    const completed = main?.completed ?? 0;
    const inProgress = main?.inProgress ?? 0;
    const avgProgress = main?.avgProgress ?? 0;
    const dates = (main?.dates ?? []).filter(
      (d): d is string => d != null && d !== ''
    );
    const studyStreak = this.computeStudyStreakFromDates(dates);

    const timeByCategory: Record<string, number> = {};
    for (const row of byCategory) {
      timeByCategory[row._id] = row.totalMinutes;
    }

    return {
      totalStudyHours: Math.round((totalTimeMinutes / 60) * 100) / 100,
      completedVsInProgress: { completed, inProgress },
      studyStreak,
      weeklyAverageProgress: Math.round((avgProgress as number) * 100) / 100,
      timeByCategory,
    };
  }


  // Compute study streak from today backwards (YYYY-MM-DD format)
  private computeStudyStreakFromDates(dateStrings: string[]): number {
    const sortedDates = [...new Set(dateStrings)].sort().reverse();
    if (sortedDates.length === 0) return 0;

    const today = new Date().toISOString().slice(0, 10);
    let streak = 0;
    let check = today;
    while (sortedDates.includes(check)) {
      streak++;
      const d = new Date(check);
      d.setDate(d.getDate() - 1);
      check = d.toISOString().slice(0, 10);
    }
    return streak;
  }


   // Implementar actualización de preferencias
  async updatePreferences(studentId: string, dto: UpdatePreferencesDto) {

  }

  /**
   * Helper para formatear tiempo
   */
  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  }

  /**
   * Método auxiliar para buscar un estudiante por ID
   */
  async findById(id: string) {
    return this.studentModel.findById(id).lean();
  }
}
