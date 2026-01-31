import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DetailedStats } from '../../../../../libs/shared/src';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

describe('StudentController', () => {
  let controller: StudentController;
  let service: StudentService;

  const mockStudentService = {
    getDashboard: jest.fn(),
    getCoursesWithProgress: jest.fn(),
    findById: jest.fn(),
    getDetailedStats: jest.fn(),
    updatePreferences: jest.fn(),
  };

  const studentId = '507f1f77bcf86cd799439011';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentController],
      providers: [
        {
          provide: StudentService,
          useValue: mockStudentService,
        },
      ],
    }).compile();

    controller = module.get<StudentController>(StudentController);
    service = module.get<StudentService>(StudentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    /**
     * ✅ TEST QUE PASA - Verifica que el dashboard retorna datos correctamente
     */
    it('should return dashboard data for valid student', async () => {
      const mockDashboard = {
        student: {
          id: '507f1f77bcf86cd799439011',
          name: 'María García',
          email: 'maria@test.com',
        },
        stats: {
          totalCourses: 5,
          completedCourses: 1,
          inProgressCourses: 2,
          totalTimeSpentMinutes: 565,
          totalTimeSpentFormatted: '9h 25m',
        },
        recentCourses: [],
      };

      mockStudentService.getDashboard.mockResolvedValue(mockDashboard);

      const result = await controller.getDashboard('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockDashboard);
      expect(service.getDashboard).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    /**
     * ✅ TEST QUE PASA - Verifica que se lanza NotFoundException para estudiante inexistente
     */
    it('should throw NotFoundException when student not found', async () => {
      mockStudentService.getDashboard.mockResolvedValue(null);

      await expect(controller.getDashboard('invalid-id')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getCourses', () => {
    /**
     * ✅ TEST QUE PASA - Verifica que se obtienen cursos con progreso
     */
    it('should return courses with progress', async () => {
      const mockCourses = [
        {
          _id: 'course1',
          title: 'React desde Cero',
          progress: { progressPercentage: 70 },
        },
        {
          _id: 'course2',
          title: 'Node.js',
          progress: null,
        },
      ];

      mockStudentService.getCoursesWithProgress.mockResolvedValue(mockCourses);

      const result = await controller.getCourses('507f1f77bcf86cd799439011');

      expect(result).toHaveLength(2);
      expect(result?.[0]?.progress?.progressPercentage).toBe(70);
    });
  });

  describe('getStats', () => {
    it('should return detailed statistics for student', async () => {
      const mockStats: DetailedStats = {
        totalStudyHours: 10.5,
        completedVsInProgress: { completed: 2, inProgress: 3 },
        studyStreak: 5,
        weeklyAverageProgress: 65.2,
        timeByCategory: { Frontend: 300, Backend: 200 },
      };
      mockStudentService.findById.mockResolvedValue({ _id: studentId });
      mockStudentService.getDetailedStats.mockResolvedValue(mockStats);

      const result = await controller.getStats(studentId);

      expect(result).toEqual(mockStats);
      expect(service.findById).toHaveBeenCalledWith(studentId);
      expect(service.getDetailedStats).toHaveBeenCalledWith(studentId);
    });

    it('should return stats with studyStreak and timeByCategory', async () => {
      const mockStats: DetailedStats = {
        totalStudyHours: 0,
        completedVsInProgress: { completed: 0, inProgress: 0 },
        studyStreak: 0,
        weeklyAverageProgress: 0,
        timeByCategory: {},
      };
      mockStudentService.findById.mockResolvedValue({ _id: studentId });
      mockStudentService.getDetailedStats.mockResolvedValue(mockStats);

      const result = await controller.getStats(studentId);

      expect(result.studyStreak).toBe(0);
      expect(result.timeByCategory).toEqual({});
    });

    it('should throw NotFoundException when student not found', async () => {
      mockStudentService.findById.mockResolvedValue(null);

      await expect(controller.getStats('invalid-id')).rejects.toThrow(
        NotFoundException
      );
      expect(service.getDetailedStats).not.toHaveBeenCalled();
    });
  });

  describe('updatePreferences', () => {
    it('should update student preferences and return updated student', async () => {
      const dto: UpdatePreferencesDto = { theme: 'dark' };
      const updatedStudent = {
        _id: studentId,
        name: 'María',
        preferences: { theme: 'dark', language: 'es', notifications: true },
      };
      mockStudentService.updatePreferences.mockResolvedValue(updatedStudent);

      const result = await controller.updatePreferences(studentId, dto);

      expect(result).toEqual(updatedStudent);
      expect(service.updatePreferences).toHaveBeenCalledWith(studentId, dto);
    });

    it('should merge partial preferences (e.g. only language)', async () => {
      const dto: UpdatePreferencesDto = { language: 'en' };
      const updatedStudent = {
        _id: studentId,
        preferences: { theme: 'light', language: 'en', notifications: true },
      };
      mockStudentService.updatePreferences.mockResolvedValue(updatedStudent);

      const result = await controller.updatePreferences(studentId, dto);

      expect(result.preferences.language).toBe('en');
      expect(service.updatePreferences).toHaveBeenCalledWith(studentId, dto);
    });

    it('should throw NotFoundException when student does not exist', async () => {
      const dto: UpdatePreferencesDto = { theme: 'dark' };
      mockStudentService.updatePreferences.mockResolvedValue(null);

      await expect(
        controller.updatePreferences('invalid-id', dto)
      ).rejects.toThrow(NotFoundException);
    });
  });
});
