import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/(auth)/login/page';

const { mockLogin } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    rememberEmail: '',
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin.mockResolvedValue({ user: { role: 'department' }, mustChangePassword: false });
  });

  it('renders the login form', () => {
    render(<LoginPage />);
    expect(screen.getByText('CA Consultancy Portal')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows error on failed login', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue({ response: { data: { message: 'Invalid credentials' } } });

    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('calls login with remember me', async () => {
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'admin@test.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(screen.getByLabelText('Remember me'));
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@test.com', 'password123', true);
    });
  });
});
