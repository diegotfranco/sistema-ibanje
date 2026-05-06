import { Link, useSearchParams } from 'react-router';
import { Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/modules/auth/PasswordInput';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import HandFinanceGraph from '@/modules/auth/HandFinanceGraph';
import { paths } from '@/lib/paths';
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { useResetPasswordForm } from '@/modules/auth/useResetPasswordForm';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const { form, onSubmit, isPending } = useResetPasswordForm(token);

  if (!token) {
    return (
      <AuthLayout illustration={<HandFinanceGraph className="text-slate-50 max-w-xs" />}>
        <div className="text-center">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-light underline underline-offset-8 decoration-teal-600 decoration-1 mb-8">
              Sistema Ibanje
            </CardTitle>
            <CardDescription>Link de redefinição inválido ou ausente.</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center bg-transparent border-none">
            <Link to={paths.forgotPassword} className="text-teal-600 hover:underline font-medium">
              Solicitar novo link
            </Link>
          </CardFooter>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout illustration={<HandFinanceGraph className="text-slate-50 max-w-xs" />}>
      <form id="form-reset-password" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-light underline underline-offset-8 decoration-teal-600 decoration-1 mb-8">
            Sistema Ibanje
          </CardTitle>

          <div className="flex items-center justify-between mb-1">
            <h2 className="text-teal-600 text-lg font-medium">Definir senha</h2>
            <Link to={paths.login} className="text-teal-600 hover:underline font-medium">
              Voltar ao login
            </Link>
          </div>
          <CardDescription className="text-left">
            Escolha uma senha com no mínimo 8 caracteres.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <FieldGroup>
            <Controller
              name="newPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="newPassword">Nova senha</FieldLabel>
                  <PasswordInput
                    {...field}
                    id="newPassword"
                    placeholder="********"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="confirmPassword">Confirmar senha</FieldLabel>
                  <PasswordInput
                    {...field}
                    id="confirmPassword"
                    placeholder="********"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </CardContent>

        <CardFooter className="bg-transparent border-none">
          <Button
            form="form-reset-password"
            type="submit"
            disabled={isPending}
            className="w-full mt-2"
            size="lg">
            {isPending ? 'Salvando...' : 'Definir senha'}
          </Button>
        </CardFooter>
      </form>
    </AuthLayout>
  );
}
