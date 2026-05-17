import { Link } from 'react-router';
import { Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { paths } from '@/lib/paths';
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { useForgotPasswordForm } from '@/modules/auth/useForgotPasswordForm';

export default function ForgotPasswordPage() {
  const { form, onSubmit, isPending } = useForgotPasswordForm();

  return (
    <AuthLayout>
      <form id="form-forgot-password" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-light underline underline-offset-8 decoration-primary decoration-1 mb-8">
            Sistema Ibanje
          </CardTitle>

          <div className="flex items-center justify-between mb-1">
            <h2 className="text-primary-soft text-lg font-medium">Esqueceu sua senha?</h2>
            <Link
              to={paths.login}
              className="font-light hover:underline underline-offset-4 decoration-primary">
              Já possui conta?
            </Link>
          </div>
          <CardDescription className="text-left">
            Informe seu e-mail e enviaremos as instruções para redefinir sua senha.
          </CardDescription>
        </CardHeader>

        <CardContent>
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
                    placeholder="exemplo@mail.com"
                    autoComplete="email"
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
            form="form-forgot-password"
            type="submit"
            disabled={isPending}
            className="w-full mt-2"
            size="lg">
            {isPending ? 'Enviando...' : 'Enviar instruções'}
          </Button>
        </CardFooter>
      </form>
    </AuthLayout>
  );
}
