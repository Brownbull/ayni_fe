/**
 * Login Page
 * User authentication login form with validation
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

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es requerido')
    .email('Formato de correo electrónico inválido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

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

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by the store
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AYNI</h1>
          <p className="text-gray-600">
            Analytics para PYMEs Chilenas
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <CardHeader
              title="Iniciar Sesión"
              subtitle="Ingresa a tu cuenta para ver tus analytics"
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
              {...register('password')}
              type="password"
              label="Contraseña"
              placeholder="••••••••"
              error={errors.password?.message}
              autoComplete="current-password"
              required
              disabled={isLoading}
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  defaultChecked
                />
                <span className="ml-2 text-gray-600">Recordarme</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>

            <div className="text-center text-sm text-gray-600">
              ¿No tienes una cuenta?{' '}
              <Link
                to="/register"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Regístrate gratis
              </Link>
            </div>
          </form>
        </Card>

        <p className="mt-8 text-center text-xs text-gray-500">
          Al iniciar sesión, aceptas nuestros{' '}
          <Link to="/terms" className="underline hover:text-gray-700">
            Términos de Servicio
          </Link>{' '}
          y{' '}
          <Link to="/privacy" className="underline hover:text-gray-700">
            Política de Privacidad
          </Link>
        </p>
      </div>
    </div>
  );
};
