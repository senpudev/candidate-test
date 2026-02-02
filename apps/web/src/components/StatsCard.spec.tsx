import { render, screen } from '@testing-library/react';
import { BookOpen, Clock } from 'lucide-react';
import { StatsCard } from './StatsCard';

describe('StatsCard', () => {
  /**
   * TEST QUE PASA - Verifica renderizado basico
   */
  it('should render title and value', () => {
    render(
      <StatsCard title="Total Cursos" value={5} icon={<BookOpen data-testid="icon" />} />
    );

    expect(screen.getByText('Total Cursos')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  /**
   * TEST QUE PASA - Verifica renderizado con string value
   */
  it('should render string value correctly', () => {
    render(
      <StatsCard title="Tiempo" value="9h 25m" icon={<Clock />} />
    );

    expect(screen.getByText('9h 25m')).toBeInTheDocument();
  });

  /**
   * TEST QUE PASA - Verifica renderizado de subtitle
   */
  it('should render subtitle when provided', () => {
    render(
      <StatsCard
        title="Tiempo"
        value="9h 25m"
        icon={<Clock />}
        subtitle="Total acumulado"
      />
    );

    expect(screen.getByText('Total acumulado')).toBeInTheDocument();
  });

  /**
   * 📝 TODO: El candidato debe añadir más tests
   */
  it('should apply custom color to icon wrapper', () => {
    render(
      <StatsCard
        title="Total Cursos"
        value={5}
        icon={<BookOpen data-testid="icon-colored" />}
        color="#ff0000"
      />
    );

    const icon = screen.getByTestId('icon-colored');
    const wrapper = icon.parentElement as HTMLElement;
    expect(wrapper).toHaveStyle('color: #ff0000');
  });

  it('should handle zero value', () => {
    render(<StatsCard title="Total Cursos" value={0} icon={<BookOpen />} />);

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should be accessible', () => {
    render(
      <StatsCard
        title="Total Cursos"
        value={5}
        icon={<BookOpen />}
      />
    );

    const card = screen.getByRole('group', { name: 'Total Cursos' });
    expect(card).toBeInTheDocument();
  });
});
