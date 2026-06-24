import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationBell from '@/components/ui/NotificationBell';

const { notificationAPI } = vi.hoisted(() => {
  const getCount = vi.fn();
  const getAll = vi.fn();
  const dismiss = vi.fn();
  return {
    notificationAPI: { getCount, getAll, dismiss },
  };
});

vi.mock('@/lib/api', () => ({ notificationAPI }));

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notificationAPI.getCount.mockResolvedValue({ data: { data: { count: 2 } } });
    notificationAPI.getAll.mockResolvedValue({
      data: {
        data: [
          { _id: '1', type: 'new_request', message: 'New request from John', link: '/dept/customers/123', createdAt: '2026-06-24T10:00:00Z' },
          { _id: '2', type: 'new_response', message: 'Response uploaded for GST', link: '/customer/responses', createdAt: '2026-06-24T11:00:00Z' },
        ],
      },
    });
    notificationAPI.dismiss.mockResolvedValue({ data: { success: true } });
  });

  it('renders bell icon with notification count', async () => {
    render(<NotificationBell />);
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
    expect(screen.getByTitle('Notifications')).toBeInTheDocument();
  });

  it('shows dropdown on click', async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    await user.click(screen.getByTitle('Notifications'));

    expect(screen.getByText('New request from John')).toBeInTheDocument();
    expect(screen.getByText('Response uploaded for GST')).toBeInTheDocument();
    expect(screen.getByText('Dismiss all')).toBeInTheDocument();
  });

  it('dismisses a notification', async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    await user.click(screen.getByTitle('Notifications'));
    await screen.findByText('New request from John');

    const links = screen.getAllByRole('link');
    await user.click(links[0]);
    expect(notificationAPI.dismiss).toHaveBeenCalledWith('1');
  });

  it('shows empty state when count is 0', async () => {
    notificationAPI.getCount.mockResolvedValue({ data: { data: { count: 0 } } });
    notificationAPI.getAll.mockResolvedValue({ data: { data: [] } });

    render(<NotificationBell />);

    await waitFor(() => {
      expect(screen.getByTitle('Notifications')).toBeInTheDocument();
    });

    expect(screen.queryByText('0')).not.toBeInTheDocument();

    await userEvent.click(screen.getByTitle('Notifications'));
    expect(await screen.findByText('No notifications')).toBeInTheDocument();
  });
});
