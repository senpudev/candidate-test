import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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

  /**
   * 📝 TODO: Implementar estadísticas detalladas
   *
   * El candidato debe implementar este método para retornar:
   * - totalStudyHours: Total de horas de estudio
   * - completedVsInProgress: { completed: number, inProgress: number }
   * - studyStreak: Días consecutivos de estudio
   * - weeklyAverageProgress: Promedio de progreso semanal
   * - timeByCategory: { [category: string]: number } - minutos por categoría
   *
   * Hints:
   * - Usar agregaciones de MongoDB ($group, $sum, etc.)
   * - Para la racha, calcular días consecutivos desde hoy hacia atrás
   * - Considerar usar lookup para unir Progress con Course
   */
  async getDetailedStats(studentId: string) {
    // TODO: El candidato debe implementar este método
    throw new Error('Not implemented');
  }

  /**
   * 📝 TODO: Implementar actualización de preferencias
   *
   * El candidato debe:
   * 1. Buscar el estudiante por ID
   * 2. Hacer un merge de las preferencias existentes con las nuevas
   * 3. Guardar y retornar el estudiante actualizado
   * 4. Manejar el caso de estudiante no encontrado (retornar null)
   *
   * Hint: Usar findByIdAndUpdate con { new: true } para retornar el documento actualizado
   */
  async updatePreferences(studentId: string, dto: UpdatePreferencesDto) {
    // TODO: El candidato debe implementar este método
    throw new Error('Not implemented');
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
