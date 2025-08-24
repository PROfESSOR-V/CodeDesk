import { render, screen } from '@testing-library/react';
import BrandName from '../BrandName';
import React from 'react';

describe('BrandName Component', () => {
  it('renders CodeDesk text', () => {
    render(<BrandName />);
    expect(screen.getByText(/Code/i)).toBeInTheDocument();
    expect(screen.getByText(/Desk/i)).toBeInTheDocument();
  });

  it('applies default variant', () => {
    render(<BrandName />);
    const code = screen.getByText('Code');
    expect(code).toHaveClass('text-gray-900');
  });

  it('applies white variant', () => {
    render(<BrandName variant="white" />);
    const code = screen.getByText('Code');
    expect(code).toHaveClass('text-white');
  });

  it('applies custom className', () => {
    render(<BrandName className="custom-class" />);
    const span = screen.getByText('Code').parentElement;
    expect(span).toHaveClass('custom-class');
  });

  it('renders with both variant and className', () => {
    render(<BrandName className="x" variant="white" />);
    const code = screen.getByText('Code');
    expect(code).toHaveClass('text-white');
    const span = code.parentElement;
    expect(span).toHaveClass('x');
  });

  it('renders Desk with orange color', () => {
    render(<BrandName />);
    const desk = screen.getByText('Desk');
    expect(desk).toHaveClass('text-[#e67829]');
  });

  it('renders Desk with white color for white variant', () => {
    render(<BrandName variant="white" />);
    const desk = screen.getByText('Desk');
    expect(desk).toHaveClass('text-white');
  });

  it('renders correctly with empty props', () => {
    render(<BrandName className="" variant="" />);
    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.getByText('Desk')).toBeInTheDocument();
  });

  it('does not throw error with missing props', () => {
    expect(() => render(<BrandName />)).not.toThrow();
  });

  it('renders with long custom className', () => {
    render(<BrandName className="a b c d" />);
    const span = screen.getByText('Code').parentElement;
    expect(span).toHaveClass('a');
    expect(span).toHaveClass('b');
    expect(span).toHaveClass('c');
    expect(span).toHaveClass('d');
  });

  it('renders with variant other than default or white', () => {
    render(<BrandName variant="other" />);
    const code = screen.getByText('Code');
    expect(code).toHaveClass('text-gray-900');
  });

  it('renders Desk with correct color for default variant', () => {
    render(<BrandName variant="default" />);
    const desk = screen.getByText('Desk');
    expect(desk).toHaveClass('text-[#e67829]');
  });

  it('renders Desk with correct color for white variant', () => {
    render(<BrandName variant="white" />);
    const desk = screen.getByText('Desk');
    expect(desk).toHaveClass('text-white');
  });
});