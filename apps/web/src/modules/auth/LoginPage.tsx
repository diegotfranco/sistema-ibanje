import { Navigate, Link } from 'react-router';
import { Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/modules/auth/PasswordInput';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { paths } from '@/lib/paths';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Checkbox } from '@/components/ui/checkbox';
import { CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useLoginForm } from '@/modules/auth/useLoginForm';

const LoginPage = () => {
  const { form, onSubmit, isPending, redirect } = useLoginForm();

  if (redirect) return <Navigate to={paths.dashboard} replace />;

  return (
    <AuthLayout>
      <form id="form-login" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <CardHeader className="space-y-8 pb-6 text-center">
          <CardTitle className="text-2xl font-light underline underline-offset-8 decoration-primary decoration-1">
            Sistema Ibanje
          </CardTitle>

          <div className="flex items-center justify-between text-left">
            <h2 className="text-primary text-lg font-medium">Login</h2>
            <Link
              to={paths.register}
              className="text-sm font-light hover:underline underline-offset-4 decoration-primary">
              Não tem uma conta?
            </Link>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="email">E-mail</FieldLabel>
                  <Input
                    {...field}
                    id="email"
                    type="email"
                    aria-invalid={fieldState.invalid}
                    placeholder="exemplo@mail.com"
                    autoComplete="email"
                    maxLength={96}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="password">Senha</FieldLabel>
                  <PasswordInput
                    id="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...field}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <div className="flex items-center justify-between pt-2">
              <Controller
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <Field orientation="horizontal">
                    <Checkbox
                      id="rememberMe"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="cursor-pointer"
                    />
                    <FieldLabel htmlFor="rememberMe" className="font-light cursor-pointer">
                      Lembrar de mim
                    </FieldLabel>
                  </Field>
                )}
              />

              <Link
                to={paths.forgotPassword}
                aria-label="Esqueci minha senha"
                className="text-sm text-nowrap font-light hover:underline underline-offset-4 decoration-primary">
                Esqueceu sua senha?
              </Link>
            </div>
          </FieldGroup>
        </CardContent>

        <CardFooter className="bg-transparent border-none">
          <Button
            type="submit"
            form="form-login"
            disabled={isPending}
            className="w-full mt-2"
            size="lg">
            {isPending ? 'Entrando...' : 'Entrar'}
          </Button>
        </CardFooter>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
