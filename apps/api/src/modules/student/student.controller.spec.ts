import { Test, TestingModule } from '@nestjs/testing';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { NotFoundException } from '@nestjs/common';

describe('StudentController', () => {
  let controller: StudentController;
  let service: StudentService;

  const mockStudentService = {
    getDashboard: jest.fn(),
    getCoursesWithProgress: jest.fn(),
    getDetailedStats: jest.fn(),
    updatePreferences: jest.fn(),
  };

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
      expect(result[0].progress.progressPercentage).toBe(70);
    });
  });

  /**
   * 📝 TODO: El candidato debe implementar estos tests
   */
  describe('getStats', () => {
    it.todo('should return detailed statistics for student');
    it.todo('should calculate study streak correctly');
    it.todo('should aggregate time by category');
    it.todo('should handle student with no courses');
  });

  describe('updatePreferences', () => {
    it.todo('should update student preferences');
    it.todo('should merge partial preferences update');
    it.todo('should validate theme value');
    it.todo('should throw NotFoundException for invalid student');
  });
});
