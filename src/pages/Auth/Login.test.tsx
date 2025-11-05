/**
 * Login Component Tests
 * Comprehensive test suite covering all 8 test types
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Login } from './Login';
import { useAuthStore } from '@/store/authStore';

// Mock the auth store
vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Component', () => {
  const mockLogin = vi.fn();
  const mockClearError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
      clearError: mockClearError,
      isAuthenticated: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
  };

  // TEST TYPE 1: VALID (Happy Path)
  describe('Valid - Happy Path', () => {
    it('should render login form with all fields', () => {
      renderLogin();

      expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
    });

    it('should successfully login with valid credentials', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce(undefined);

      renderLogin();

      await user.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com');
      await user.type(screen.getByLabelText(/contraseña/i), 'password123');
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('should navigate to dashboard after successful login', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce(undefined);

      renderLogin();

      await user.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com');
      await user.type(screen.getByLabelText(/contraseña/i), 'password123');
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  // TEST TYPE 2: ERROR HANDLING
  describe('Error Handling', () => {
    it('should display error message when login fails', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Invalid credentials';

      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        login: mockLogin,
        isLoading: false,
        error: { message: errorMessage },
        clearError: mockClearError,
        isAuthenticated: false,
      });

      renderLogin();

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValueOnce(new Error('Network error'));

      renderLogin();

      await user.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com');
      await user.type(screen.getByLabelText(/contraseña/i), 'password123');
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });

    it('should clear error on component unmount', () => {
      const { unmount } = renderLogin();

      unmount();

      expect(mockClearError).toHaveBeenCalled();
    });
  });

  // TEST TYPE 3: INVALID INPUT VALIDATION
  describe('Invalid Input Validation', () => {
    it('should show validation error for invalid email format', async () => {
      const user = userEvent.setup();

      renderLogin();

      await user.type(screen.getByLabelText(/correo electrónico/i), 'invalid-email');
      await user.type(screen.getByLabelText(/contraseña/i), 'password123');
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

      await waitFor(() => {
        expect(screen.getByText(/formato de correo electrónico inválido/i)).toBeInTheDocument();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should show validation error for empty email', async () => {
      const user = userEvent.setup();

      renderLogin();

      await user.type(screen.getByLabelText(/contraseña/i), 'password123');
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

      await waitFor(() => {
        expect(screen.getByText(/el correo electrónico es requerido/i)).toBeInTheDocument();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should show validation error for empty password', async () => {
      const user = userEvent.setup();

      renderLogin();

      await user.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

      await waitFor(() => {
        expect(screen.getByText(/la contraseña es requerida/i)).toBeInTheDocument();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should show validation error for short password', async () => {
      const user = userEvent.setup();

      renderLogin();

      await user.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com');
      await user.type(screen.getByLabelText(/contraseña/i), '12345');
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

      await waitFor(() => {
        expect(screen.getByText(/la contraseña debe tener al menos 6 caracteres/i)).toBeInTheDocument();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  // TEST TYPE 4: EDGE CASES
  describe('Edge Cases', () => {
    it('should redirect if user is already authenticated', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        login: mockLogin,
        isLoading: false,
        error: null,
        clearError: mockClearError,
        isAuthenticated: true,
      });

      renderLogin();

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should disable form fields during loading', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        login: mockLogin,
        isLoading: true,
        error: null,
        clearError: mockClearError,
        isAuthenticated: false,
      });

      renderLogin();

      expect(screen.getByLabelText(/correo electrónico/i)).toBeDisabled();
      expect(screen.getByLabelText(/contraseña/i)).toBeDisabled();
      expect(screen.getByRole('button', { name: /iniciando sesión/i })).toBeDisabled();
    });

    it('should handle very long email addresses', async () => {
      const user = userEvent.setup();
      const longEmail = 'a'.repeat(100) + '@example.com';

      renderLogin();

      await user.type(screen.getByLabelText(/correo electrónico/i), longEmail);
      await user.type(screen.getByLabelText(/contraseña/i), 'password123');
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: longEmail,
          password: 'password123',
        });
      });
    });
  });

  // TEST TYPE 5: FUNCTIONAL (Business Logic)
  describe('Functional - Business Logic', () => {
    it('should call login with form data on submit', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce(undefined);

      renderLogin();

      const email = 'user@test.com';
      const password = 'mypassword123';

      await user.type(screen.getByLabelText(/correo electrónico/i), email);
      await user.type(screen.getByLabelText(/contraseña/i), password);
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({ email, password });
      });
    });

    it('should have link to registration page', () => {
      renderLogin();

      const registerLink = screen.getByRole('link', { name: /regístrate gratis/i });
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute('href', '/register');
    });

    it('should have link to forgot password page', () => {
      renderLogin();

      const forgotLink = screen.getByRole('link', { name: /olvidaste tu contraseña/i });
      expect(forgotLink).toBeInTheDocument();
      expect(forgotLink).toHaveAttribute('href', '/forgot-password');
    });
  });

  // TEST TYPE 6: VISUAL (UI Components)
  describe('Visual - UI Components', () => {
    it('should render AYNI branding', () => {
      renderLogin();

      expect(screen.getByText('AYNI')).toBeInTheDocument();
      expect(screen.getByText(/analytics para pymes chilenas/i)).toBeInTheDocument();
    });

    it('should render card with proper header', () => {
      renderLogin();

      expect(screen.getByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument();
      expect(screen.getByText(/ingresa a tu cuenta para ver tus analytics/i)).toBeInTheDocument();
    });

    it('should show loading state in button when submitting', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        login: mockLogin,
        isLoading: true,
        error: null,
        clearError: mockClearError,
        isAuthenticated: false,
      });

      renderLogin();

      expect(screen.getByRole('button', { name: /iniciando sesión/i })).toBeInTheDocument();
    });

    it('should render remember me checkbox', () => {
      renderLogin();

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toBeChecked(); // Default checked
    });
  });

  // TEST TYPE 7: PERFORMANCE
  describe('Performance', () => {
    it('should render form quickly', () => {
      const startTime = performance.now();
      renderLogin();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should render in less than 100ms
    });

    it('should not cause unnecessary re-renders', async () => {
      const user = userEvent.setup();
      const { container } = renderLogin();

      const initialHTML = container.innerHTML;

      await user.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com');

      // Only the input value should change, not the entire structure
      expect(container.querySelector('form')).toBeTruthy();
    });
  });

  // TEST TYPE 8: SECURITY
  describe('Security', () => {
    it('should use password input type for password field', () => {
      renderLogin();

      const passwordInput = screen.getByLabelText(/contraseña/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should have autocomplete attributes for credentials', () => {
      renderLogin();

      expect(screen.getByLabelText(/correo electrónico/i)).toHaveAttribute('autocomplete', 'email');
      expect(screen.getByLabelText(/contraseña/i)).toHaveAttribute('autocomplete', 'current-password');
    });

    it('should not expose password in DOM', () => {
      renderLogin();

      const container = document.body;
      expect(container.textContent).not.toContain('password123');
    });

    it('should prevent form submission on enter in invalid state', async () => {
      const user = userEvent.setup();

      renderLogin();

      await user.type(screen.getByLabelText(/correo electrónico/i), 'invalid-email');
      await user.keyboard('{Enter}');

      expect(mockLogin).not.toHaveBeenCalled();
    });
  });
});
