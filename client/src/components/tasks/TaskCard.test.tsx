import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from './TaskCard';
import { Task } from '@shared/schema';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the apiRequest function
vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn().mockResolvedValue({}),
  queryClient: new QueryClient()
}));

// Mock the useToast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('TaskCard', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });
  
  const mockTask: Task = {
    id: 1,
    externalId: 'test-123',
    action: 'Clean the bathroom',
    description: 'The bathroom needs cleaning',
    listingName: 'Apartment 42',
    status: 'new',
    teamTarget: null,
    urgency: null,
    createdAt: new Date(),
    rawPayload: {}
  };
  
  it('renders task information correctly', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskCard task={mockTask} />
      </QueryClientProvider>
    );
    
    // Check that the title is displayed
    expect(screen.getByText('Apartment 42')).toBeInTheDocument();
    
    // Check that the description is displayed
    expect(screen.getByText('The bathroom needs cleaning')).toBeInTheDocument();
    
    // Check that all team buttons are displayed
    expect(screen.getByText('Internal')).toBeInTheDocument();
    expect(screen.getByText('Cleaning')).toBeInTheDocument();
    expect(screen.getByText('Maintenance')).toBeInTheDocument();
    expect(screen.getByText('Landlord')).toBeInTheDocument();
    
    // Check that all urgency buttons are displayed
    expect(screen.getByText('Urgent')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
    
    // Check that action buttons are displayed
    expect(screen.getByText('Watch')).toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
  });
  
  // Add more tests as needed for button clicks, state updates, etc.
});