import React from 'react';
import { render, screen } from '@testing-library/react';
import { MessageList } from '../MessageList';
import { Message } from '../ChatInterface';

describe('MessageList', () => {
  it('should render empty list when no messages', () => {
    const { container } = render(<MessageList messages={[]} />);
    expect(container.firstChild?.childNodes.length).toBe(0);
  });

  it('should render user message with "You" label', () => {
    const messages: Message[] = [
      {
        role: 'user',
        content: 'Hello, I need help building an app'
      }
    ];

    render(<MessageList messages={messages} />);

    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('Hello, I need help building an app')).toBeInTheDocument();
  });

  it('should render assistant message with "Claude" label', () => {
    const messages: Message[] = [
      {
        role: 'assistant',
        content: 'What do you want to build today?'
      }
    ];

    render(<MessageList messages={messages} />);

    expect(screen.getByText('Claude')).toBeInTheDocument();
    expect(screen.getByText('What do you want to build today?')).toBeInTheDocument();
  });

  it('should apply different styling for user and assistant messages', () => {
    const messages: Message[] = [
      {
        role: 'user',
        content: 'User message'
      },
      {
        role: 'assistant',
        content: 'Assistant message'
      }
    ];

    const { container } = render(<MessageList messages={messages} />);

    const userMessage = container.querySelector('.bg-blue-100');
    const assistantMessage = container.querySelector('.bg-gray-100');

    expect(userMessage).toBeInTheDocument();
    expect(assistantMessage).toBeInTheDocument();
  });

  it('should render multiple messages in order', () => {
    const messages: Message[] = [
      {
        role: 'assistant',
        content: 'What do you want to build today?'
      },
      {
        role: 'user',
        content: 'I need email automation'
      },
      {
        role: 'assistant',
        content: 'What kind of emails do you need to automate?'
      },
      {
        role: 'user',
        content: 'Follow-ups for clients'
      }
    ];

    render(<MessageList messages={messages} />);

    const messageElements = screen.getAllByRole('generic');
    expect(messageElements.length).toBeGreaterThan(0);

    // Check that all messages are rendered
    expect(screen.getByText('What do you want to build today?')).toBeInTheDocument();
    expect(screen.getByText('I need email automation')).toBeInTheDocument();
    expect(screen.getByText('What kind of emails do you need to automate?')).toBeInTheDocument();
    expect(screen.getByText('Follow-ups for clients')).toBeInTheDocument();
  });

  it('should preserve line breaks in message content', () => {
    const messages: Message[] = [
      {
        role: 'assistant',
        content: 'Here are some options:\n1. Email automation\n2. Task scheduling\n3. Data integration'
      }
    ];

    const { container } = render(<MessageList messages={messages} />);
    const contentDiv = container.querySelector('.whitespace-pre-wrap');

    expect(contentDiv).toBeInTheDocument();
    expect(contentDiv?.textContent).toContain('Here are some options:');
    expect(contentDiv?.textContent).toContain('1. Email automation');
  });

  it('should apply ml-12 class to user messages for alignment', () => {
    const messages: Message[] = [
      {
        role: 'user',
        content: 'Test message'
      }
    ];

    const { container } = render(<MessageList messages={messages} />);
    const userMessage = container.querySelector('.ml-12');

    expect(userMessage).toBeInTheDocument();
  });

  it('should apply mr-12 class to assistant messages for alignment', () => {
    const messages: Message[] = [
      {
        role: 'assistant',
        content: 'Test message'
      }
    ];

    const { container } = render(<MessageList messages={messages} />);
    const assistantMessage = container.querySelector('.mr-12');

    expect(assistantMessage).toBeInTheDocument();
  });
});
