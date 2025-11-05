/**
 * ChangePassword Component Tests
 * Comprehensive test suite covering all 8 test types
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ChangePassword } from './ChangePassword';
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

describe('ChangePassword Component', () => {
  const mockChangePassword = vi.fn();
  const mockClearError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      changePassword: mockChangePassword,
      isLoading: false,
      error: null,
      clearError: mockClearError,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderChangePassword = () => {
    return render(
      <BrowserRouter>
        <ChangePassword />
      </BrowserRouter>
    );
  };

  // TEST TYPE 1: VALID (Happy Path)
  describe('Valid - Happy Path', () => {
    it('should render change password form with all fields', () => {
      renderChangePassword();

      expect(screen.getByLabelText(/contraseña actual/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/nueva contraseña/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirmar nueva contraseña/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cambiar contraseña/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    });

    it('should successfully change password with valid data', async () => {
      const user = userEvent.setup();
      mockChangePassword.mockResolvedValueOnce(undefined);

      renderChangePassword();

      await user.type(screen.getByLabelText(/contraseña actual/i), 'OldPassword123');
      await user.type(screen.getByLabelText(/nueva contraseña/i), 'NewPassword456');
      await user.type(screen.getByLabelText(/confirmar nueva contraseña/i), 'NewPassword456');
      await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

      await waitFor(() => {
        expect(mockChangePassword).toHaveBeenCalledWith({
          old_password: 'OldPassword123',
          new_password: 'NewPassword456',
          new_password_confirm: 'NewPassword456',
        });
      });
    });

    it('should show success message after password change', async () => {
      const user = userEvent.setup();
      mockChangePassword.mockResolvedValueOnce(undefined);

      renderChangePassword();

      await user.type(screen.getByLabelText(/contraseña actual/i), 'OldPassword123');
      await user.type(screen.getByLabelText(/nueva contraseña/i), 'NewPassword456');
      await user.type(screen.getByLabelText(/confirmar nueva contraseña/i), 'NewPassword456');
      await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

      await waitFor(() => {
        expect(screen.getByText(/contraseña actualizada exitosamente/i)).toBeInTheDocument();
      });
    });

    it('should redirect to dashboard after successful password change', async () => {
      const user = userEvent.setup();
      mockChangePassword.mockResolvedValueOnce(undefined);

      vi.useFakeTimers();

      renderChangePassword();

      await user.type(screen.getByLabelText(/contraseña actual/i), 'OldPassword123');
      await user.type(screen.getByLabelText(/nueva contraseña/i), 'NewPassword456');
      await user.type(screen.getByLabelText(/confirmar nueva contraseña/i), 'NewPassword456');
      await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

      await waitFor(() => {
        expect(screen.getByText(/redirigiendo/i)).toBeInTheDocument();
      });

      // Fast-forward time by 2 seconds
      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });

      vi.useRealTimers();
    });
  });

  // TEST TYPE 2: ERROR HANDLING
  describe('Error Handling', () => {
    it('should display error message when password change fails', async () => {
      const errorMessage = 'Current password is incorrect';

      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        changePassword: mockChangePassword,
        isLoading: false,
        error: { message: errorMessage },
        clearError: mockClearError,
      });

      renderChangePassword();

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      const user = userEvent.setup();
      mockChangePassword.mockRejectedValueOnce(new Error('API error'));

      renderChangePassword();

      await user.type(screen.getByLabelText(/contraseña actual/i), 'OldPassword123');
      await user.type(screen.getByLabelText(/nueva contraseña/i), 'NewPassword456');
      await user.type(screen.getByLabelText(/confirmar nueva contraseña/i), 'NewPassword456');
      await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

      await waitFor(() => {
        expect(mockChangePassword).toHaveBeenCalled();
      });
    });

    it('should clear error on submit', async () => {
      const user = userEvent.setup();

      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        changePassword: mockChangePassword,
        isLoading: false,
        error: { message: 'Previous error' },
        clearError: mockClearError,
      });

      renderChangePassword();

      await user.type(screen.getByLabelText(/contraseña actual/i), 'OldPassword123');
      await user.type(screen.getByLabelText(/nueva contraseña/i), 'NewPassword456');
      await user.type(screen.getByLabelText(/confirmar nueva contraseña/i), 'NewPassword456');
      await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

      expect(mockClearError).toHaveBeenCalled();
    });
  });

  // TEST TYPE 3: INVALID INPUT VALIDATION
  describe('Invalid Input Validation', () => {
    it('should show validation error for empty old password', async () => {
      const user = userEvent.setup();

      renderChangePassword();

      await user.type(screen.getByLabelText(/nueva contraseña/i), 'NewPassword456');
      await user.type(screen.getByLabelText(/confirmar nueva contraseña/i), 'NewPassword456');
      await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

      await waitFor(() => {
        expect(screen.getByText(/la contraseña actual es requerida/i)).toBeInTheDocument();
      });

      expect(mockChangePassword).not.toHaveBeenCalled();
    });

    it('should show validation error for weak new password', async () => {
      const user = userEvent.setup();

      renderChangePassword();

      await user.type(screen.getByLabelText(/contraseña actual/i), 'OldPassword123');
      await user.type(screen.getByLabelText(/nueva contraseña/i), 'weak');
      await user.type(screen.getByLabelText(/confirmar nueva contraseña/i), 'weak');
      await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

      await waitFor(() => {
        expect(screen.getByText(/la contraseña debe tener al menos 8 caracteres/i)).toBeInTheDocument();
      });

      expect(mockChangePassword).not.toHaveBeenCalled();
    });

    it('should show validation error when new passwords do not match', async () => {
      const user = userEvent.setup();

      renderChangePassword();

      await user.type(screen.getByLabelText(/contraseña actual/i), 'OldPassword123');
      await user.type(screen.getByLabelText(/nueva contraseña/i), 'NewPassword456');
      await user.type(screen.getByLabelText(/confirmar nueva contraseña/i), 'DifferentPassword789');
      await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

      await waitFor(() => {
        expect(screen.getByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
      });

      expect(mockChangePassword).not.toHaveBeenCalled();
    });

    it('should show validation error when new password is same as old', async () => {
      const user = userEvent.setup();

      renderChangePassword();

      await user.type(screen.getByLabelText(/contraseña actual/i), 'SamePassword123');
      await user.type(screen.getByLabelText(/nueva contraseña/i), 'SamePassword123');
      await user.type(screen.getByLabelText(/confirmar nueva contraseña/i), 'SamePassword123');
      await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

      await waitFor(() => {
        expect(screen.getByText(/la nueva contraseña debe ser diferente a la actual/i)).toBeInTheDocument();
      });

      expect(mockChangePassword).not.toHaveBeenCalled();
    });

    it('should show validation error for password without uppercase', async () => {
      const user = userEvent.setup();

      renderChangePassword();

      await user.type(screen.getByLabelText(/contraseña actual/i), 'OldPassword123');
      await user.type(screen.getByLabelText(/nueva contraseña/i), 'newpassword456');
      await user.type(screen.getByLabelText(/confirmar nueva contraseña/i), 'newpassword456');
      await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

      await waitFor(() => {
        expect(screen.getByText(/debe contener al menos una mayúscula/i)).toBeInTheDocument();
      });

      expect(mockChangePassword).not.toHaveBeenCalled();
    });

    it('should show validation error for password without lowercase', async () => {
      const user = userEvent.setup();

      renderChangePassword();

      await user.type(screen.getByLabelText(/contraseña actual/i), 'OldPassword123');
      await user.type(screen.getByLabelText(/nueva contraseña/i), 'NEWPASSWORD456');
      await user.type(screen.getByLabelText(/confirmar nueva contraseña/i), 'NEWPASSWORD456');
      await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

      await waitFor(() => {
        expect(screen.getByText(/debe contener al menos una minúscula/i)).toBeInTheDocument();
      });

      expect(mockChangePassword).not.toHaveBeenCalled();
    });

    it('should show validation error for password without number', async () => {
      const user = userEvent.setup();

      renderChangePassword();

      await user.type(screen.getByLabelText(/contraseña actual/i), 'OldPassword123');
      await user.type(screen.getByLabelText(/nueva contraseña/i), 'NewPassword');
      await user.type(screen.getByLabelText(/confirmar nueva contraseña/i), 'NewPassword');
      await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

      await waitFor(() => {
        expect(screen.getByText(/debe contener al menos un número/i)).toBeInTheDocument();
      });

      expect(mockChangePassword).not.toHaveBeenCalled();
    });
  });

  // TEST TYPE 4: EDGE CASES
  describe('Edge Cases', () => {
    it('should disable all fields during loading', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        changePassword: mockChangePassword,
        isLoading: true,
        error: null,
        clearError: mockClearError,
      });

      renderChangePassword();

      expect(screen.getByLabelText(/contraseña actual/i)).toBeDisabled();
      expect(screen.getByLabelText(/nueva contraseña/i)).toBeDisabled();
      expect(screen.getByLabelText(/confirmar nueva contraseña/i)).toBeDisabled();
      expect(screen.getByRole('button', { name: /actualizando/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled();
    });

    it('should disable all fields after success', async () => {
      const user = userEvent.setup();
      mockChangePassword.mockResolvedValueOnce(undefined);

      renderChangePassword();

      await user.type(screen.getByLabelText(/contraseña actual/i), 'OldPassword123');
      await user.type(screen.getByLabelText(/nueva contraseña/i), 'NewPassword456');
      await user.type(screen.getByLabelText(/confirmar nueva contraseña/i), 'NewPassword456');
      await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/contraseña actual/i)).toBeDisabled();
        expect(screen.getByLabelText(/nueva contraseña/i)).toBeDisabled();
        expect(screen.getByLabelText(/confirmar nueva contraseña/i)).toBeDisabled();
      });
    });

    it('should clear form after successful password change', async () => {
      const user = userEvent.setup();
      mockChangePassword.mockResolvedValueOnce(undefined);

      renderChangePassword();

      await user.type(screen.getByLabelText(/contraseña actual/i), 'OldPassword123');
      await user.type(screen.getByLabelText(/nueva contraseña/i), 'NewPassword456');
      await user.type(screen.getByLabelText(/confirmar nueva contraseña/i), 'NewPassword456');
      await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/contraseña actual/i)).toHaveValue('');
        expect(screen.getByLabelText(/nueva contraseña/i)).toHaveValue('');
        expect(screen.getByLabelText(/confirmar nueva contraseña/i)).toHaveValue('');
      });
    });

    it('should handle cancel navigation', async () => {
      const user = userEvent.setup();

      renderChangePassword();

      await user.click(screen.getByRole('button', { name: /cancelar/i }));

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  // TEST TYPE 5: FUNCTIONAL (Business Logic)
  describe('Functional - Business Logic', () => {
    it('should call changePassword with correct data', async () => {
      const user = userEvent.setup();
      mockChangePassword.mockResolvedValueOnce(undefined);

      renderChangePassword();

      const formData = {
        old_password: 'MyOldPassword123',
        new_password: 'MyNewPassword456',
        new_password_confirm: 'MyNewPassword456',
      };

      await user.type(screen.getByLabelText(/contraseña actual/i), formData.old_password);
      await user.type(screen.getByLabelText(/nueva contraseña/i), formData.new_password);
      await user.type(screen.getByLabelText(/confirmar nueva contraseña/i), formData.new_password_confirm);
      await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

      await waitFor(() => {
        expect(mockChangePassword).toHaveBeenCalledWith(formData);
      });
    });

    it('should display password requirements list', () => {
      renderChangePassword();

      expect(screen.getByText(/al menos 8 caracteres/i)).toBeInTheDocument();
      expect(screen.getByText(/una letra mayúscula/i)).toBeInTheDocument();
      expect(screen.getByText(/una letra minúscula/i)).toBeInTheDocument();
      expect(screen.getByText(/un número/i)).toBeInTheDocument();
    });

    it('should have two buttons: cancel and submit', () => {
      renderChangePassword();

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cambiar contraseña/i })).toBeInTheDocument();
    });
  });

  // TEST TYPE 6: VISUAL (UI Components)
  describe('Visual - UI Components', () => {
    it('should render card with proper header', () => {
      renderChangePassword();

      expect(screen.getByText(/cambiar contraseña/i)).toBeInTheDocument();
      expect(screen.getByText(/actualiza tu contraseña de forma segura/i)).toBeInTheDocument();
    });

    it('should show loading state in submit button', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        changePassword: mockChangePassword,
        isLoading: true,
        error: null,
        clearError: mockClearError,
      });

      renderChangePassword();

      expect(screen.getByRole('button', { name: /actualizando/i })).toBeInTheDocument();
    });

    it('should display success alert with green styling', async () => {
      const user = userEvent.setup();
      mockChangePassword.mockResolvedValueOnce(undefined);

      renderChangePassword();

      await user.type(screen.getByLabelText(/contraseña actual/i), 'OldPassword123');
      await user.type(screen.getByLabelText(/nueva contraseña/i), 'NewPassword456');
      await user.type(screen.getByLabelText(/confirmar nueva contraseña/i), 'NewPassword456');
      await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

      await waitFor(() => {
        const successAlert = screen.getByRole('alert');
        expect(successAlert).toBeInTheDocument();
        expect(successAlert.className).toContain('green');
      });
    });

    it('should show password requirements in info box', () => {
      renderChangePassword();

      const requirementsText = screen.getByText(/tu nueva contraseña debe contener/i);
      expect(requirementsText).toBeInTheDocument();
      expect(requirementsText.closest('div')).toHaveClass('bg-gray-50');
    });
  });

  // TEST TYPE 7: PERFORMANCE
  describe('Performance', () => {
    it('should render form quickly', () => {
      const startTime = performance.now();
      renderChangePassword();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should render in less than 100ms
    });

    it('should handle form submission efficiently', async () => {
      const user = userEvent.setup();
      mockChangePassword.mockResolvedValueOnce(undefined);

      renderChangePassword();

      await user.type(screen.getByLabelText(/contraseña actual/i), 'OldPassword123');
      await user.type(screen.getByLabelText(/nueva contraseña/i), 'NewPassword456');
      await user.type(screen.getByLabelText(/confirmar nueva contraseña/i), 'NewPassword456');

      const startTime = performance.now();
      await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(200);
    });
  });

  // TEST TYPE 8: SECURITY
  describe('Security', () => {
    it('should use password input type for all password fields', () => {
      renderChangePassword();

      const oldPasswordInput = screen.getByLabelText(/contraseña actual/i);
      const newPasswordInput = screen.getByLabelText(/nueva contraseña/i);
      const confirmPasswordInput = screen.getByLabelText(/confirmar nueva contraseña/i);

      expect(oldPasswordInput).toHaveAttribute('type', 'password');
      expect(newPasswordInput).toHaveAttribute('type', 'password');
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    });

    it('should have autocomplete attributes', () => {
      renderChangePassword();

      expect(screen.getByLabelText(/contraseña actual/i)).toHaveAttribute('autocomplete', 'current-password');
      expect(screen.getByLabelText(/nueva contraseña/i)).toHaveAttribute('autocomplete', 'new-password');
      expect(screen.getByLabelText(/confirmar nueva contraseña/i)).toHaveAttribute('autocomplete', 'new-password');
    });

    it('should not expose passwords in DOM', () => {
      renderChangePassword();

      const container = document.body;
      expect(container.textContent).not.toContain('Password123');
    });

    it('should enforce strong password requirements', async () => {
      const user = userEvent.setup();

      renderChangePassword();

      const weakPasswords = [
        { pwd: 'short', error: '8 caracteres' },
        { pwd: 'lowercase123', error: 'mayúscula' },
        { pwd: 'UPPERCASE123', error: 'minúscula' },
        { pwd: 'NoNumbers', error: 'número' },
      ];

      for (const { pwd, error } of weakPasswords) {
        // Clear fields
        const oldPwdInput = screen.getByLabelText(/contraseña actual/i);
        const newPwdInput = screen.getByLabelText(/nueva contraseña/i);
        const confirmPwdInput = screen.getByLabelText(/confirmar nueva contraseña/i);

        await user.clear(oldPwdInput);
        await user.clear(newPwdInput);
        await user.clear(confirmPwdInput);

        await user.type(oldPwdInput, 'OldPassword123');
        await user.type(newPwdInput, pwd);
        await user.type(confirmPwdInput, pwd);
        await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

        await waitFor(() => {
          expect(document.body.textContent).toContain(error);
        });
      }
    });

    it('should prevent using same password', async () => {
      const user = userEvent.setup();

      renderChangePassword();

      const samePassword = 'SamePassword123';

      await user.type(screen.getByLabelText(/contraseña actual/i), samePassword);
      await user.type(screen.getByLabelText(/nueva contraseña/i), samePassword);
      await user.type(screen.getByLabelText(/confirmar nueva contraseña/i), samePassword);
      await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

      await waitFor(() => {
        expect(screen.getByText(/la nueva contraseña debe ser diferente a la actual/i)).toBeInTheDocument();
      });

      expect(mockChangePassword).not.toHaveBeenCalled();
    });
  });
});
