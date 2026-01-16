export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  totalLessons: number;
  category: string;
  tags: string[];
  durationMinutes: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Progress {
  studentId: string;
  courseId: string;
  completedLessons: number;
  progressPercentage: number;
  lastAccessedAt?: Date;
  timeSpentMinutes: number;
}

export interface CourseWithProgress extends Course {
  progress: Progress | null;
}

export type CourseStatus = 'not-started' | 'in-progress' | 'completed';
