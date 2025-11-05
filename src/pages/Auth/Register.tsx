/**
 * Register Page
 * New user registration form with validation
 */

import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader } from '@/components/ui/Card';

const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'El correo electrónico es requerido')
      .email('Formato de correo electrónico inválido'),
    username: z
      .string()
      .min(1, 'El nombre de usuario es requerido')
      .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
      .max(30, 'El nombre de usuario no puede exceder 30 caracteres')
      .regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guiones bajos'),
    password: z
      .string()
      .min(1, 'La contraseña es requerida')
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    password_confirm: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['password_confirm'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading, error, clearError, isAuthenticated } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
      password_confirm: '',
    },
  });

  const password = watch('password');

  // Password strength indicator
  const getPasswordStrength = (pwd: string): { strength: number; label: string; color: string } => {
    if (!pwd) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;

    if (strength <= 2) return { strength, label: 'Débil', color: 'bg-red-500' };
    if (strength <= 4) return { strength, label: 'Media', color: 'bg-yellow-500' };
    return { strength, label: 'Fuerte', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(password);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Clear error on component unmount
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data);
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by the store
      console.error('Registration failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AYNI</h1>
          <p className="text-gray-600">
            Crea tu cuenta y comienza a analizar tus datos
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <CardHeader
              title="Crear Cuenta"
              subtitle="Regístrate gratis y empieza hoy"
            />

            {error && (
              <div
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md"
                role="alert"
              >
                <p className="text-sm">{error.message}</p>
              </div>
            )}

            <Input
              {...register('email')}
              type="email"
              label="Correo Electrónico"
              placeholder="tu@empresa.cl"
              error={errors.email?.message}
              autoComplete="email"
              required
              disabled={isLoading}
            />

            <Input
              {...register('username')}
              type="text"
              label="Nombre de Usuario"
              placeholder="tunombre"
              error={errors.username?.message}
              helperText="Solo letras, números y guiones bajos"
              autoComplete="username"
              required
              disabled={isLoading}
            />

            <div>
              <Input
                {...register('password')}
                type="password"
                label="Contraseña"
                placeholder="••••••••"
                error={errors.password?.message}
                autoComplete="new-password"
                required
                disabled={isLoading}
              />
              {password && !errors.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Seguridad:</span>
                    <span className="font-medium">{passwordStrength.label}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${passwordStrength.color} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${(passwordStrength.strength / 6) * 100}%` }}
                      role="progressbar"
                      aria-valuenow={passwordStrength.strength}
                      aria-valuemin={0}
                      aria-valuemax={6}
                      aria-label="Password strength"
                    />
                  </div>
                </div>
              )}
            </div>

            <Input
              {...register('password_confirm')}
              type="password"
              label="Confirmar Contraseña"
              placeholder="••••••••"
              error={errors.password_confirm?.message}
              autoComplete="new-password"
              required
              disabled={isLoading}
            />

            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-md">
              <p className="font-medium mb-1">Tu contraseña debe contener:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Al menos 8 caracteres</li>
                <li>Una letra mayúscula</li>
                <li>Una letra minúscula</li>
                <li>Un número</li>
              </ul>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                required
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                disabled={isLoading}
              />
              <label className="ml-2 text-sm text-gray-600">
                Acepto los{' '}
                <Link to="/terms" className="text-blue-600 hover:text-blue-500 underline">
                  Términos de Servicio
                </Link>{' '}
                y la{' '}
                <Link to="/privacy" className="text-blue-600 hover:text-blue-500 underline">
                  Política de Privacidad
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
            >
              {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </Button>

            <div className="text-center text-sm text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Inicia sesión
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
