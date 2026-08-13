import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LastPassings } from './LastPassings';
import type { Passing } from '../api/types';

const passings: Passing[] = [
  { passtime: '12:01:02', runnerName: 'Anna A', class: 'H21', control: 240, controlName: 'Radio 2', time: '12:34' },
];

describe('LastPassings', () => {
  it('renders each passing with runner, class, control and time', () => {
    render(<LastPassings passings={passings} />);
    expect(screen.getByText('Anna A')).toBeInTheDocument();
    expect(screen.getByText('H21')).toBeInTheDocument();
    expect(screen.getByText('Radio 2')).toBeInTheDocument();
    expect(screen.getByText('12:34')).toBeInTheDocument();
  });

  it('renders an empty state when there are no passings', () => {
    render(<LastPassings passings={[]} />);
    expect(screen.getByText(/no passings/i)).toBeInTheDocument();
  });
});
