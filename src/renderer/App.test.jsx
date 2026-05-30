import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App entry', () => {
  it('renders the login page by default', () => {
    render(<App />);
    expect(screen.getByText(/Welcome Back/i)).toBeInTheDocument();
  });
});
