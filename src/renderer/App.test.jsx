import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

describe('App entry', () => {
  it('shows the splash screen then renders the login page', async () => {
    render(<App />);
    expect(screen.getByText(/Loading application.../i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Welcome Back/i)).toBeInTheDocument(), { timeout: 4000 });
  });
});
