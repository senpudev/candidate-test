import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { BookOpen, CheckCircle, Clock, Target, BarChart3 } from 'lucide-react';
import { StatsCard } from '../components/StatsCard';
import { CourseCard } from '../components/CourseCard';
import { api } from '../services/api';

interface DashboardProps {
  studentId: string;
}

/**
 * ✅ PARCIALMENTE IMPLEMENTADO - Página del Dashboard
 *
 * El candidato debe completar:
 * 1. Implementar el componente ActivityChart (gráfico de actividad semanal)
 * 2. Implementar la lista de cursos con scroll horizontal
 * 3. Añadir estados de loading y error
 * 4. Implementar la sección de cursos recientes
 */
export function Dashboard({ studentId }: DashboardProps) {
  const {
    data: dashboard,
    isLoading: isLoadingDashboard,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: ['dashboard', studentId],
    queryFn: () => api.getDashboard(studentId),
  });

  const { data: courses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['courses', studentId],
    queryFn: () => api.getCourses(studentId),
  });

  const isLoading = isLoadingDashboard;
  const error = dashboardError;

  if (isLoading) {
    return (
      <Container>
        <Header>
          <SkeletonBlock width={280} height={36} />
          <SkeletonBlock width={200} height={20} $marginTop={8} />
        </Header>
        <StatsGrid>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </StatsGrid>
        <Section>
          <SkeletonBlock width={180} height={24} style={{ marginBottom: 16 }} />
          <ActivityChartPlaceholder>
            <PlaceholderText>
              <BarChart3 size={32} style={{ marginBottom: '8px', opacity: 0.3 }} />
              <br />
              Cargando...
            </PlaceholderText>
          </ActivityChartPlaceholder>
        </Section>
        <Section>
          <SkeletonBlock width={220} height={24} $marginBottom={16} />
          <CoursesGrid>
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </CoursesGrid>
        </Section>
      </Container>
    );
  }

  if (error) {
    return (
      <ErrorState>
        <ErrorContent>
          <p>Error al cargar el dashboard</p>
          <RetryButton type="button" onClick={() => refetchDashboard()}>
            Reintentar
          </RetryButton>
        </ErrorContent>
      </ErrorState>
    );
  }

  if (!dashboard) {
    return <ErrorState>No se encontraron datos</ErrorState>;
  }

  return (
    <Container>
      <Header>
        <Greeting>
          <h1>¡Hola, {dashboard.student.name}!</h1>
          <Subtitle>Aquí está tu progreso de hoy</Subtitle>
        </Greeting>
      </Header>

      {/* Sección de estadísticas */}
      <StatsGrid>
        <StatsCard
          title="Cursos Activos"
          value={dashboard.stats.inProgressCourses}
          icon={<BookOpen size={24} />}
          color="var(--color-primary)"
        />
        <StatsCard
          title="Cursos Completados"
          value={dashboard.stats.completedCourses}
          icon={<CheckCircle size={24} />}
          color="var(--color-success)"
        />
        <StatsCard
          title="Tiempo de Estudio"
          value={dashboard.stats.totalTimeSpentFormatted}
          icon={<Clock size={24} />}
          color="var(--color-secondary)"
          subtitle="Total acumulado"
        />
        <StatsCard
          title="Total Cursos"
          value={dashboard.stats.totalCourses}
          icon={<Target size={24} />}
          color="var(--color-primary)"
        />
      </StatsGrid>

      {/* 📝 TODO: Implementar gráfico de actividad semanal */}
      <Section>
        <SectionTitle>Actividad Semanal</SectionTitle>
        <ActivityChartPlaceholder>
          {/* TODO: El candidato debe implementar ActivityChart
           *
           * Requisitos:
           * - Mostrar actividad de los últimos 7 días
           * - Usar chart.js o recharts
           * - Mostrar horas de estudio por día
           * - Incluir tooltip con detalles
           *
           * Datos de ejemplo:
           * const weeklyData = [
           *   { day: 'Lun', hours: 2.5 },
           *   { day: 'Mar', hours: 1.0 },
           *   { day: 'Mié', hours: 3.0 },
           *   ...
           * ];
           */}
          <PlaceholderText>
            <BarChart3 size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
            <br />
            Gráfico de Actividad
            <br />
            <small>TODO: Implementar con chart.js o recharts</small>
          </PlaceholderText>
        </ActivityChartPlaceholder>
      </Section>

      {/* Sección de cursos recientes */}
      <Section>
        <SectionHeader>
          <SectionTitle>Continúa donde lo dejaste</SectionTitle>
          <ViewAllLink href="/courses">Ver todos →</ViewAllLink>
        </SectionHeader>

        {/* 📝 TODO: Implementar lista de cursos con mejor UX */}
        <CoursesGrid>
          {courses?.slice(0, 4).map((course: any) => (
            <CourseCard
              key={course._id}
              title={course.title}
              description={course.description}
              thumbnail={course.thumbnail}
              progress={course.progress?.progressPercentage || 0}
              category={course.category}
              totalLessons={course.totalLessons}
              completedLessons={course.progress?.completedLessons || 0}
            />
          ))}
        </CoursesGrid>

        {/* TODO: Implementar empty state si no hay cursos */}
        {courses?.length === 0 && (
          <EmptyState>
            No tienes cursos todavía. ¡Explora el catálogo!
          </EmptyState>
        )}
      </Section>
    </Container>
  );
}

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.header`
  margin-bottom: var(--spacing-xl);
`;

const Greeting = styled.div`
  h1 {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: var(--spacing-xs);
  }
`;

const Subtitle = styled.p`
  color: var(--color-text-secondary);
  font-size: 16px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
`;

const Section = styled.section`
  margin-bottom: var(--spacing-xl);
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
`;

const ViewAllLink = styled.a`
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 500;
`;

const ActivityChartPlaceholder = styled.div`
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PlaceholderText = styled.div`
  text-align: center;
  color: var(--color-text-secondary);
`;

const CoursesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-md);
`;

const SkeletonBlock = styled.div<{ width?: number; height?: number; $marginTop?: number; $marginBottom?: number }>`
  width: ${(p) => p.width ?? 100}px;
  height: ${(p) => p.height ?? 20}px;
  margin-top: ${(p) => p.$marginTop ?? 0}px;
  margin-bottom: ${(p) => p.$marginBottom ?? 0}px;
  background: linear-gradient(
    90deg,
    var(--color-border) 25%,
    var(--color-surface) 50%,
    var(--color-border) 75%
  );
  background-size: 200% 100%;
  animation: skeleton 1.2s ease-in-out infinite;
  border-radius: var(--radius-sm);
  @keyframes skeleton {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

const SkeletonCard = styled.div`
  height: 120px;
  background: linear-gradient(
    90deg,
    var(--color-border) 25%,
    var(--color-surface) 50%,
    var(--color-border) 75%
  );
  background-size: 200% 100%;
  animation: skeleton 1.2s ease-in-out infinite;
  border-radius: var(--radius-lg);
  @keyframes skeleton {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

const ErrorState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: var(--color-error);
`;

const ErrorContent = styled.div`
  text-align: center;
  p {
    margin-bottom: var(--spacing-md);
  }
`;

const RetryButton = styled.button`
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  &:hover {
    opacity: 0.9;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-secondary);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px dashed var(--color-border);
`;
