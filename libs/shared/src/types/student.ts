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

/** Main $group result from getDetailedStats aggregation (totals + dates for streak). */
export interface StatsMainGroup {
  totalTimeMinutes: number;
  completed: number;
  inProgress: number;
  avgProgress: number | null;
  dates: (string | null)[];
}

/** $group result by category: minutes per category. */
export interface StatsByCategoryGroup {
  _id: string;
  totalMinutes: number;
}

/** Shape of the document returned by getDetailedStats $facet. */
export interface GetDetailedStatsAggregationResult {
  main: StatsMainGroup[];
  byCategory: StatsByCategoryGroup[];
}

/** Return type of getDetailedStats. */
export interface DetailedStats {
  totalStudyHours: number;
  completedVsInProgress: { completed: number; inProgress: number };
  studyStreak: number;
  weeklyAverageProgress: number;
  timeByCategory: Record<string, number>;
}
