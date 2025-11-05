/**
 * Change Password Page
 * Allow authenticated users to change their password
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader } from '@/components/ui/Card';

const changePasswordSchema = z
  .object({
    old_password: z
      .string()
      .min(1, 'La contraseña actual es requerida'),
    new_password: z
      .string()
      .min(1, 'La nueva contraseña es requerida')
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    new_password_confirm: z.string().min(1, 'Confirma tu nueva contraseña'),
  })
  .refine((data) => data.new_password !== data.old_password, {
    message: 'La nueva contraseña debe ser diferente a la actual',
    path: ['new_password'],
  })
  .refine((data) => data.new_password === data.new_password_confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['new_password_confirm'],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const ChangePassword: React.FC = () => {
  const navigate = useNavigate();
  const { changePassword, isLoading, error, clearError } = useAuthStore();
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      old_password: '',
      new_password: '',
      new_password_confirm: '',
    },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setSuccess(false);
    clearError();

    try {
      await changePassword(data);
      setSuccess(true);
      reset();

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      // Error is handled by the store
      console.error('Change password failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <CardHeader
              title="Cambiar Contraseña"
              subtitle="Actualiza tu contraseña de forma segura"
            />

            {error && (
              <div
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md"
                role="alert"
              >
                <p className="text-sm">{error.message}</p>
              </div>
            )}

            {success && (
              <div
                className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md"
                role="alert"
              >
                <p className="text-sm">
                  ¡Contraseña actualizada exitosamente! Redirigiendo...
                </p>
              </div>
            )}

            <Input
              {...register('old_password')}
              type="password"
              label="Contraseña Actual"
              placeholder="••••••••"
              error={errors.old_password?.message}
              autoComplete="current-password"
              required
              disabled={isLoading || success}
            />

            <Input
              {...register('new_password')}
              type="password"
              label="Nueva Contraseña"
              placeholder="••••••••"
              error={errors.new_password?.message}
              autoComplete="new-password"
              required
              disabled={isLoading || success}
            />

            <Input
              {...register('new_password_confirm')}
              type="password"
              label="Confirmar Nueva Contraseña"
              placeholder="••••••••"
              error={errors.new_password_confirm?.message}
              autoComplete="new-password"
              required
              disabled={isLoading || success}
            />

            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-md">
              <p className="font-medium mb-1">Tu nueva contraseña debe contener:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Al menos 8 caracteres</li>
                <li>Una letra mayúscula</li>
                <li>Una letra minúscula</li>
                <li>Un número</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => navigate('/dashboard')}
                disabled={isLoading || success}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={isLoading}
                disabled={success}
              >
                {isLoading ? 'Actualizando...' : 'Cambiar Contraseña'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
