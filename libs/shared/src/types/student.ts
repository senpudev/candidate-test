export interface Student {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences: StudentPreferences;
  lastActive?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StudentPreferences {
  theme?: 'light' | 'dark';
  language?: string;
  notifications?: boolean;
}

export interface StudentStats {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalTimeSpentMinutes: number;
  totalTimeSpentFormatted: string;
}

export interface DashboardData {
  student: Pick<Student, 'id' | 'name' | 'email' | 'avatar' | 'preferences'>;
  stats: StudentStats;
  recentCourses: RecentCourse[];
}

export interface RecentCourse {
  course: any; // CourseWithProgress
  progress: number;
  lastAccessed?: Date;
}
