import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Dashboard } from './Dashboard';
import { api } from '../services/api';

// Mock del servicio API
jest.mock('../services/api', () => ({
  api: {
    getDashboard: jest.fn(),
    getCourses: jest.fn(),
  },
}));

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

const mockCourses = [
  {
    _id: '1',
    title: 'React desde Cero',
    description: 'Aprende React',
    category: 'Frontend',
    totalLessons: 20,
    progress: { progressPercentage: 70, completedLessons: 14 },
  },
];

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Dashboard', () => {
  beforeEach(() => {
    (api.getDashboard as jest.Mock).mockResolvedValue(mockDashboard);
    (api.getCourses as jest.Mock).mockResolvedValue(mockCourses);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * ✅ TEST QUE PASA - Verifica que el dashboard renderiza el greeting
   */
  it('should render student greeting', async () => {
    renderWithProviders(<Dashboard studentId="507f1f77bcf86cd799439011" />);

    await waitFor(() => {
      expect(screen.getByText(/¡Hola, María García!/)).toBeInTheDocument();
    });
  });

  /**
   * ✅ TEST QUE PASA - Verifica que se muestran las stats cards
   */
  it('should render stats cards', async () => {
    renderWithProviders(<Dashboard studentId="507f1f77bcf86cd799439011" />);

    await waitFor(() => {
      expect(screen.getByText('Cursos Activos')).toBeInTheDocument();
      expect(screen.getByText('Cursos Completados')).toBeInTheDocument();
      expect(screen.getByText('Tiempo de Estudio')).toBeInTheDocument();
    });
  });

  /**
   * ✅ TEST QUE PASA - Verifica estado de loading
   */
  it('should show loading state initially', () => {
    (api.getDashboard as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithProviders(<Dashboard studentId="test" />);

    expect(screen.getByText('Cargando dashboard...')).toBeInTheDocument();
  });

  /**
   * 📝 TODO: El candidato debe implementar estos tests
   */
  it('should show error state when API fails', async () => {
    (api.getDashboard as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    renderWithProviders(<Dashboard studentId="507f1f77bcf86cd799439011" />);

    await waitFor(() => {
      expect(screen.getByText('Error al cargar el dashboard')).toBeInTheDocument();
    });
  });

  it('should render course cards when courses are returned', async () => {
    renderWithProviders(<Dashboard studentId="507f1f77bcf86cd799439011" />);

    await waitFor(() => {
      expect(screen.getByText('React desde Cero')).toBeInTheDocument();
    });
  });

  it('should show empty state when no courses', async () => {
    (api.getCourses as jest.Mock).mockResolvedValueOnce([]);

    renderWithProviders(<Dashboard studentId="507f1f77bcf86cd799439011" />);

    await waitFor(() => {
      expect(
        screen.getByText('No tienes cursos todavía. ¡Explora el catálogo!')
      ).toBeInTheDocument();
    });
  });

  it('should render activity chart placeholder', async () => {
    renderWithProviders(<Dashboard studentId="507f1f77bcf86cd799439011" />);

    await waitFor(() => {
      expect(screen.getByText('Gráfico de Actividad')).toBeInTheDocument();
    });
  });

  it('should have a main heading for the student', async () => {
    renderWithProviders(<Dashboard studentId="507f1f77bcf86cd799439011" />);

    const heading = await screen.findByRole('heading', {
      name: /¡Hola, María García!/i,
    });
    expect(heading.tagName).toBe('H1');
  });
});
