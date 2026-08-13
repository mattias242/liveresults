import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClassList } from './ClassList';

describe('ClassList', () => {
  it('renders every class name', () => {
    render(<ClassList classes={['H21', 'D21', 'H45']} selected={null} onSelect={() => {}} />);
    expect(screen.getByText('H21')).toBeInTheDocument();
    expect(screen.getByText('D21')).toBeInTheDocument();
    expect(screen.getByText('H45')).toBeInTheDocument();
  });

  it('calls onSelect with the clicked class', async () => {
    const onSelect = vi.fn();
    render(<ClassList classes={['H21', 'D21']} selected={null} onSelect={onSelect} />);
    await userEvent.click(screen.getByText('D21'));
    expect(onSelect).toHaveBeenCalledWith('D21');
  });

  it('marks the selected class as current', () => {
    render(<ClassList classes={['H21', 'D21']} selected="H21" onSelect={() => {}} />);
    expect(screen.getByText('H21')).toHaveAttribute('aria-current', 'true');
  });

  it('shows a loading state when classes are not yet available', () => {
    render(<ClassList classes={[]} selected={null} onSelect={() => {}} />);
    expect(screen.getByText(/loading classes/i)).toBeInTheDocument();
  });
});
