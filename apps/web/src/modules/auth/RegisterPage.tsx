import { Link, Navigate } from 'react-router';
import { Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { paths } from '@/lib/paths';
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { useRegisterForm } from '@/modules/auth/useRegisterForm';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';

export default function RegisterPage() {
  const { data: user } = useCurrentUser();
  const { form, onSubmit, isPending } = useRegisterForm();

  if (user) return <Navigate to={paths.dashboard} replace />;

  return (
    <AuthLayout>
      <form id="form-register" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-light underline underline-offset-8 decoration-primary decoration-1 mb-8">
            Sistema Ibanje
          </CardTitle>

          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-medium">Cadastro</h2>
            <Link
              to={paths.login}
              className="font-light hover:underline underline-offset-4 decoration-primary">
              Já possui conta?
            </Link>
          </div>
          <CardDescription className="text-left">
            Sua solicitação ficará pendente até a aprovação de um administrador.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="name">Nome completo</FieldLabel>
                  <Input
                    {...field}
                    id="name"
                    type="text"
                    placeholder="Seu nome"
                    autoComplete="name"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

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
            type="submit"
            form="form-register"
            disabled={isPending}
            className="w-full mt-2"
            size="lg">
            {isPending ? 'Enviando...' : 'Solicitar acesso'}
          </Button>
        </CardFooter>
      </form>
    </AuthLayout>
  );
}
