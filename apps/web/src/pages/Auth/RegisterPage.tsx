import { Link, Navigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import HandFinanceGraph from '@/components/icons/HandFinanceGraph';
import routes from '@/enums/routes.enum';
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { zodResolver } from '@/lib/zodResolver';
import { Controller, useForm } from 'react-hook-form';
import { RegisterSchema, type RegisterFormValues } from '@/schemas/auth';

export default function RegisterPage() {
  const { data: user } = useCurrentUser();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { name: '', email: '' }
  });

  const { mutate: register, isPending } = useMutation({
    mutationFn: (data: RegisterFormValues) =>
      api.post('/auth/register', { name: data.name, email: data.email }),
    onSuccess: () => {
      toast.success('Cadastro enviado! Aguarde a aprovação de um administrador.');
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 409) {
        toast.error('Este e-mail já está cadastrado.');
      } else {
        toast.error('Ocorreu um erro. Tente novamente.');
      }
    }
  });

  if (user) return <Navigate to={routes.ROOT.path} replace />;

  const onSubmit = (values: RegisterFormValues) => register(values);

  return (
    <AuthLayout illustration={<HandFinanceGraph className="text-slate-50 max-w-xs" />}>
      <form id="form-register" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-light underline underline-offset-8 decoration-teal-600 decoration-1 mb-8">
            Sistema Ibanje
          </CardTitle>

          <div className="flex items-center justify-between mb-1">
            <h2 className="text-teal-600 text-lg font-medium">Cadastro</h2>
            <Link
              to={routes.LOGIN.path}
              className="font-light hover:underline underline-offset-4 decoration-teal-600">
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
