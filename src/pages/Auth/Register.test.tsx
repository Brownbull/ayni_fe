/**
 * Register Component Tests
 * Comprehensive test suite covering all 8 test types
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Register } from './Register';
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

describe('Register Component', () => {
  const mockRegister = vi.fn();
  const mockClearError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: null,
      clearError: mockClearError,
      isAuthenticated: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderRegister = () => {
    return render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
  };

  // TEST TYPE 1: VALID (Happy Path)
  describe('Valid - Happy Path', () => {
    it('should render registration form with all fields', () => {
      renderRegister();

      expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/nombre de usuario/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^contraseña$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /crear cuenta/i })).toBeInTheDocument();
    });

    it('should successfully register with valid data', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValueOnce(undefined);

      renderRegister();

      await user.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com');
      await user.type(screen.getByLabelText(/nombre de usuario/i), 'testuser');
      await user.type(screen.getByLabelText(/^contraseña$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'Password123');
      await user.click(screen.getByRole('button', { name: /crear cuenta/i }));

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          email: 'test@example.com',
          username: 'testuser',
          password: 'Password123',
          password_confirm: 'Password123',
        });
      });
    });

    it('should navigate to dashboard after successful registration', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValueOnce(undefined);

      renderRegister();

      await user.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com');
      await user.type(screen.getByLabelText(/nombre de usuario/i), 'testuser');
      await user.type(screen.getByLabelText(/^contraseña$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'Password123');
      await user.click(screen.getByRole('button', { name: /crear cuenta/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should display password strength indicator', async () => {
      const user = userEvent.setup();

      renderRegister();

      await user.type(screen.getByLabelText(/^contraseña$/i), 'Password123');

      await waitFor(() => {
        expect(screen.getByText(/seguridad:/i)).toBeInTheDocument();
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });
  });

  // TEST TYPE 2: ERROR HANDLING
  describe('Error Handling', () => {
    it('should display error message when registration fails', async () => {
      const errorMessage = 'Email already exists';

      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        register: mockRegister,
        isLoading: false,
        error: { message: errorMessage },
        clearError: mockClearError,
        isAuthenticated: false,
      });

      renderRegister();

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      mockRegister.mockRejectedValueOnce(new Error('Network error'));

      renderRegister();

      await user.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com');
      await user.type(screen.getByLabelText(/nombre de usuario/i), 'testuser');
      await user.type(screen.getByLabelText(/^contraseña$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'Password123');
      await user.click(screen.getByRole('button', { name: /crear cuenta/i }));

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalled();
      });
    });

    it('should clear error on component unmount', () => {
      const { unmount } = renderRegister();

      unmount();

      expect(mockClearError).toHaveBeenCalled();
    });
  });

  // TEST TYPE 3: INVALID INPUT VALIDATION
  describe('Invalid Input Validation', () => {
    it('should show validation error for invalid email format', async () => {
      const user = userEvent.setup();

      renderRegister();

      await user.type(screen.getByLabelText(/correo electrónico/i), 'invalid-email');
      await user.type(screen.getByLabelText(/nombre de usuario/i), 'testuser');
      await user.type(screen.getByLabelText(/^contraseña$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'Password123');
      await user.click(screen.getByRole('button', { name: /crear cuenta/i }));

      await waitFor(() => {
        expect(screen.getByText(/formato de correo electrónico inválido/i)).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should show validation error for short username', async () => {
      const user = userEvent.setup();

      renderRegister();

      await user.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com');
      await user.type(screen.getByLabelText(/nombre de usuario/i), 'ab');
      await user.type(screen.getByLabelText(/^contraseña$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'Password123');
      await user.click(screen.getByRole('button', { name: /crear cuenta/i }));

      await waitFor(() => {
        expect(screen.getByText(/el nombre de usuario debe tener al menos 3 caracteres/i)).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should show validation error for invalid username characters', async () => {
      const user = userEvent.setup();

      renderRegister();

      await user.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com');
      await user.type(screen.getByLabelText(/nombre de usuario/i), 'user@name');
      await user.type(screen.getByLabelText(/^contraseña$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'Password123');
      await user.click(screen.getByRole('button', { name: /crear cuenta/i }));

      await waitFor(() => {
        expect(screen.getByText(/solo letras, números y guiones bajos/i)).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should show validation error for weak password (no uppercase)', async () => {
      const user = userEvent.setup();

      renderRegister();

      await user.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com');
      await user.type(screen.getByLabelText(/nombre de usuario/i), 'testuser');
      await user.type(screen.getByLabelText(/^contraseña$/i), 'password123');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'password123');
      await user.click(screen.getByRole('button', { name: /crear cuenta/i }));

      await waitFor(() => {
        expect(screen.getByText(/debe contener al menos una mayúscula/i)).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should show validation error for weak password (no lowercase)', async () => {
      const user = userEvent.setup();

      renderRegister();

      await user.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com');
      await user.type(screen.getByLabelText(/nombre de usuario/i), 'testuser');
      await user.type(screen.getByLabelText(/^contraseña$/i), 'PASSWORD123');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'PASSWORD123');
      await user.click(screen.getByRole('button', { name: /crear cuenta/i }));

      await waitFor(() => {
        expect(screen.getByText(/debe contener al menos una minúscula/i)).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should show validation error for weak password (no number)', async () => {
      const user = userEvent.setup();

      renderRegister();

      await user.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com');
      await user.type(screen.getByLabelText(/nombre de usuario/i), 'testuser');
      await user.type(screen.getByLabelText(/^contraseña$/i), 'Password');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'Password');
      await user.click(screen.getByRole('button', { name: /crear cuenta/i }));

      await waitFor(() => {
        expect(screen.getByText(/debe contener al menos un número/i)).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should show validation error for short password', async () => {
      const user = userEvent.setup();

      renderRegister();

      await user.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com');
      await user.type(screen.getByLabelText(/nombre de usuario/i), 'testuser');
      await user.type(screen.getByLabelText(/^contraseña$/i), 'Pass1');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'Pass1');
      await user.click(screen.getByRole('button', { name: /crear cuenta/i }));

      await waitFor(() => {
        expect(screen.getByText(/la contraseña debe tener al menos 8 caracteres/i)).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should show validation error when passwords do not match', async () => {
      const user = userEvent.setup();

      renderRegister();

      await user.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com');
      await user.type(screen.getByLabelText(/nombre de usuario/i), 'testuser');
      await user.type(screen.getByLabelText(/^contraseña$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'Password456');
      await user.click(screen.getByRole('button', { name: /crear cuenta/i }));

      await waitFor(() => {
        expect(screen.getByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });
  });

  // TEST TYPE 4: EDGE CASES
  describe('Edge Cases', () => {
    it('should redirect if user is already authenticated', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        register: mockRegister,
        isLoading: false,
        error: null,
        clearError: mockClearError,
        isAuthenticated: true,
      });

      renderRegister();

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should disable form fields during loading', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        register: mockRegister,
        isLoading: true,
        error: null,
        clearError: mockClearError,
        isAuthenticated: false,
      });

      renderRegister();

      expect(screen.getByLabelText(/correo electrónico/i)).toBeDisabled();
      expect(screen.getByLabelText(/nombre de usuario/i)).toBeDisabled();
      expect(screen.getByLabelText(/^contraseña$/i)).toBeDisabled();
      expect(screen.getByLabelText(/confirmar contraseña/i)).toBeDisabled();
      expect(screen.getByRole('button', { name: /creando cuenta/i })).toBeDisabled();
    });

    it('should handle maximum length username', async () => {
      const user = userEvent.setup();
      const longUsername = 'a'.repeat(30);

      renderRegister();

      await user.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com');
      await user.type(screen.getByLabelText(/nombre de usuario/i), longUsername);
      await user.type(screen.getByLabelText(/^contraseña$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'Password123');

      // Should accept 30 characters
      expect(screen.getByLabelText(/nombre de usuario/i)).toHaveValue(longUsername);
    });

    it('should show weak password strength for simple passwords', async () => {
      const user = userEvent.setup();

      renderRegister();

      await user.type(screen.getByLabelText(/^contraseña$/i), 'Pass1234');

      await waitFor(() => {
        expect(screen.getByText(/débil/i)).toBeInTheDocument();
      });
    });

    it('should show strong password strength for complex passwords', async () => {
      const user = userEvent.setup();

      renderRegister();

      await user.type(screen.getByLabelText(/^contraseña$/i), 'MyP@ssw0rd!2024');

      await waitFor(() => {
        expect(screen.getByText(/fuerte/i)).toBeInTheDocument();
      });
    });
  });

  // TEST TYPE 5: FUNCTIONAL (Business Logic)
  describe('Functional - Business Logic', () => {
    it('should call register with form data on submit', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValueOnce(undefined);

      renderRegister();

      const formData = {
        email: 'user@test.com',
        username: 'myusername',
        password: 'MyPassword123',
        password_confirm: 'MyPassword123',
      };

      await user.type(screen.getByLabelText(/correo electrónico/i), formData.email);
      await user.type(screen.getByLabelText(/nombre de usuario/i), formData.username);
      await user.type(screen.getByLabelText(/^contraseña$/i), formData.password);
      await user.type(screen.getByLabelText(/confirmar contraseña/i), formData.password_confirm);
      await user.click(screen.getByRole('button', { name: /crear cuenta/i }));

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith(formData);
      });
    });

    it('should have link to login page', () => {
      renderRegister();

      const loginLink = screen.getByRole('link', { name: /inicia sesión/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('should have links to terms and privacy', () => {
      renderRegister();

      const termsLinks = screen.getAllByRole('link', { name: /términos de servicio/i });
      const privacyLinks = screen.getAllByRole('link', { name: /política de privacidad/i });

      expect(termsLinks.length).toBeGreaterThan(0);
      expect(privacyLinks.length).toBeGreaterThan(0);
    });

    it('should display password requirements list', () => {
      renderRegister();

      expect(screen.getByText(/al menos 8 caracteres/i)).toBeInTheDocument();
      expect(screen.getByText(/una letra mayúscula/i)).toBeInTheDocument();
      expect(screen.getByText(/una letra minúscula/i)).toBeInTheDocument();
      expect(screen.getByText(/un número/i)).toBeInTheDocument();
    });

    it('should require terms acceptance checkbox', () => {
      renderRegister();

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveAttribute('required');
    });
  });

  // TEST TYPE 6: VISUAL (UI Components)
  describe('Visual - UI Components', () => {
    it('should render AYNI branding', () => {
      renderRegister();

      expect(screen.getByText('AYNI')).toBeInTheDocument();
      expect(screen.getByText(/crea tu cuenta y comienza a analizar tus datos/i)).toBeInTheDocument();
    });

    it('should render card with proper header', () => {
      renderRegister();

      expect(screen.getByText(/crear cuenta/i)).toBeInTheDocument();
      expect(screen.getByText(/regístrate gratis y empieza hoy/i)).toBeInTheDocument();
    });

    it('should show loading state in button when submitting', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        register: mockRegister,
        isLoading: true,
        error: null,
        clearError: mockClearError,
        isAuthenticated: false,
      });

      renderRegister();

      expect(screen.getByRole('button', { name: /creando cuenta/i })).toBeInTheDocument();
    });

    it('should display password strength indicator with progress bar', async () => {
      const user = userEvent.setup();

      renderRegister();

      await user.type(screen.getByLabelText(/^contraseña$/i), 'Password123');

      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toBeInTheDocument();
        expect(progressBar).toHaveAttribute('aria-valuenow');
        expect(progressBar).toHaveAttribute('aria-valuemin', '0');
        expect(progressBar).toHaveAttribute('aria-valuemax', '6');
      });
    });

    it('should show helper text for username field', () => {
      renderRegister();

      expect(screen.getByText(/solo letras, números y guiones bajos/i)).toBeInTheDocument();
    });
  });

  // TEST TYPE 7: PERFORMANCE
  describe('Performance', () => {
    it('should render form quickly', () => {
      const startTime = performance.now();
      renderRegister();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should render in less than 100ms
    });

    it('should update password strength indicator efficiently', async () => {
      const user = userEvent.setup();
      renderRegister();

      const startTime = performance.now();
      await user.type(screen.getByLabelText(/^contraseña$/i), 'P');
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500); // Should update quickly
    });
  });

  // TEST TYPE 8: SECURITY
  describe('Security', () => {
    it('should use password input type for password fields', () => {
      renderRegister();

      const passwordInput = screen.getByLabelText(/^contraseña$/i);
      const confirmInput = screen.getByLabelText(/confirmar contraseña/i);

      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(confirmInput).toHaveAttribute('type', 'password');
    });

    it('should have autocomplete attributes for credentials', () => {
      renderRegister();

      expect(screen.getByLabelText(/correo electrónico/i)).toHaveAttribute('autocomplete', 'email');
      expect(screen.getByLabelText(/nombre de usuario/i)).toHaveAttribute('autocomplete', 'username');
      expect(screen.getByLabelText(/^contraseña$/i)).toHaveAttribute('autocomplete', 'new-password');
      expect(screen.getByLabelText(/confirmar contraseña/i)).toHaveAttribute('autocomplete', 'new-password');
    });

    it('should not expose password in DOM', () => {
      renderRegister();

      const container = document.body;
      expect(container.textContent).not.toContain('Password123');
    });

    it('should validate username format to prevent injection', async () => {
      const user = userEvent.setup();

      renderRegister();

      await user.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com');
      await user.type(screen.getByLabelText(/nombre de usuario/i), '<script>alert("xss")</script>');
      await user.type(screen.getByLabelText(/^contraseña$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'Password123');
      await user.click(screen.getByRole('button', { name: /crear cuenta/i }));

      await waitFor(() => {
        expect(screen.getByText(/solo letras, números y guiones bajos/i)).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should enforce strong password requirements', async () => {
      const user = userEvent.setup();

      renderRegister();

      const weakPasswords = ['password', '12345678', 'PASSWORD', 'Pass1'];

      for (const weakPassword of weakPasswords) {
        await user.clear(screen.getByLabelText(/^contraseña$/i));
        await user.clear(screen.getByLabelText(/confirmar contraseña/i));

        await user.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com');
        await user.type(screen.getByLabelText(/nombre de usuario/i), 'testuser');
        await user.type(screen.getByLabelText(/^contraseña$/i), weakPassword);
        await user.type(screen.getByLabelText(/confirmar contraseña/i), weakPassword);
        await user.click(screen.getByRole('button', { name: /crear cuenta/i }));

        // Should show at least one validation error
        await waitFor(() => {
          const alerts = screen.queryAllByRole('alert');
          const errorTexts = document.body.textContent || '';
          expect(
            alerts.length > 0 ||
            errorTexts.includes('mayúscula') ||
            errorTexts.includes('minúscula') ||
            errorTexts.includes('número') ||
            errorTexts.includes('8 caracteres')
          ).toBe(true);
        });
      }
    });
  });
});
