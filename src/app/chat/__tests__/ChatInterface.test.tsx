import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatInterface } from '../ChatInterface';

// Mock fetch
global.fetch = jest.fn();

describe('ChatInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with welcome message', () => {
    render(<ChatInterface />);

    expect(screen.getByText('AI Development Cockpit')).toBeInTheDocument();
    expect(screen.getByText('What do you want to build today?')).toBeInTheDocument();
  });

  it('should render input field with plain English placeholder', () => {
    render(<ChatInterface />);

    const input = screen.getByPlaceholderText('Describe in plain English...');
    expect(input).toBeInTheDocument();
  });

  it('should render send button', () => {
    render(<ChatInterface />);

    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeInTheDocument();
  });

  it('should disable send button when input is empty', () => {
    render(<ChatInterface />);

    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  it('should enable send button when input has text', () => {
    render(<ChatInterface />);

    const input = screen.getByPlaceholderText('Describe in plain English...');
    fireEvent.change(input, { target: { value: 'I need email automation' } });

    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeEnabled();
  });

  it('should add user message when form is submitted', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'What kind of emails do you need to automate?' })
    });

    render(<ChatInterface />);

    const input = screen.getByPlaceholderText('Describe in plain English...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'I need email automation' } });
    fireEvent.click(sendButton);

    // User message should appear
    expect(screen.getByText('I need email automation')).toBeInTheDocument();
  });

  it('should call API endpoint with message and history', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'What kind of emails?' })
    });

    render(<ChatInterface />);

    const input = screen.getByPlaceholderText('Describe in plain English...');
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Test message')
      });
    });
  });

  it('should show loading state while waiting for response', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ response: 'Response' })
      }), 100))
    );

    render(<ChatInterface />);

    const input = screen.getByPlaceholderText('Describe in plain English...');
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    expect(screen.getByText('Thinking...')).toBeInTheDocument();
  });

  it('should display assistant response after API call', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'What kind of emails do you need to automate?' })
    });

    render(<ChatInterface />);

    const input = screen.getByPlaceholderText('Describe in plain English...');
    fireEvent.change(input, { target: { value: 'I need email automation' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText('What kind of emails do you need to automate?')).toBeInTheDocument();
    });
  });

  it('should clear input field after sending message', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'Response' })
    });

    render(<ChatInterface />);

    const input = screen.getByPlaceholderText('Describe in plain English...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('should show error message when API call fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<ChatInterface />);

    const input = screen.getByPlaceholderText('Describe in plain English...');
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/encountered an error/i)).toBeInTheDocument();
    });
  });

  it('should show network error message when fetch fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

    render(<ChatInterface />);

    const input = screen.getByPlaceholderText('Describe in plain English...');
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/unable to connect/i)).toBeInTheDocument();
    });
  });

  it('should show rate limit error message when API returns 429', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({})
    });

    render(<ChatInterface />);

    const input = screen.getByPlaceholderText('Describe in plain English...');
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/too many requests/i)).toBeInTheDocument();
    });
  });

  it('should show server error message when API returns 500', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({})
    });

    render(<ChatInterface />);

    const input = screen.getByPlaceholderText('Describe in plain English...');
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument();
    });
  });

  it('should have accessibility labels on input field', () => {
    render(<ChatInterface />);

    const input = screen.getByLabelText('Chat message input');
    expect(input).toBeInTheDocument();
  });

  it('should have aria-live region for messages', () => {
    const { container } = render(<ChatInterface />);

    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
  });

  it('should update aria-busy during loading state', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ response: 'Response' })
      }), 100))
    );

    const { container } = render(<ChatInterface />);

    const input = screen.getByPlaceholderText('Describe in plain English...');
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion?.getAttribute('aria-busy')).toBe('true');
  });

  it('should display multiple messages in conversation history', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: 'What kind of emails?' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: 'Where is your client data?' })
      });

    render(<ChatInterface />);

    const input = screen.getByPlaceholderText('Describe in plain English...');

    // First message
    fireEvent.change(input, { target: { value: 'I need email automation' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText('What kind of emails?')).toBeInTheDocument();
    });

    // Second message
    fireEvent.change(input, { target: { value: 'Follow-ups for clients' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText('Where is your client data?')).toBeInTheDocument();
    });

    // All messages should be visible
    expect(screen.getByText('I need email automation')).toBeInTheDocument();
    expect(screen.getByText('What kind of emails?')).toBeInTheDocument();
    expect(screen.getByText('Follow-ups for clients')).toBeInTheDocument();
  });
});
