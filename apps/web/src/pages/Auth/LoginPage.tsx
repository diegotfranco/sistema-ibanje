import { useNavigate, Navigate, Link } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/PasswordInput';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import HandFinanceGraph from '@/components/icons/HandFinanceGraph';
import routes from '@/enums/routes.enum';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Checkbox } from '@/components/ui/checkbox';
import { zodResolver } from '@/lib/zodResolver';
import { CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginSchema, type LoginFormValues } from '@/schemas/auth';

const LoginPage = () => {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '', rememberMe: true }
  });

  const { mutate: login, isPending } = useMutation({
    mutationFn: (data: LoginFormValues) =>
      api.post('/auth/login', { email: data.email, password: data.password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Seja bem-vindo!');
      navigate(routes.ROOT.path, { replace: true });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 401) {
        form.setError('root', { message: 'E-mail ou senha inválidos.' });
      } else {
        form.setError('root', { message: 'Ocorreu um erro. Tente novamente.' });
      }
    }
  });

  if (user) return <Navigate to={routes.ROOT.path} replace />;

  const onSubmit = (values: LoginFormValues) => login(values);

  return (
    <AuthLayout illustration={<HandFinanceGraph className="text-slate-50 max-w-xs" />}>
      <form id="form-login" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <CardHeader className="space-y-8 pb-6 text-center">
          <CardTitle className="text-2xl font-light underline underline-offset-8 decoration-teal-600 decoration-1">
            Sistema Ibanje
          </CardTitle>

          <div className="flex items-center justify-between text-left">
            <h2 className="text-teal-600 text-lg font-medium">Login</h2>
            <Link
              to={routes.REGISTER.path}
              className="text-sm font-light hover:underline underline-offset-4 decoration-teal-600">
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
                  <FieldLabel>E-mail</FieldLabel>
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
                  <FieldLabel>Senha</FieldLabel>
                  <PasswordInput
                    placeholder="********"
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
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="cursor-pointer"
                    />
                    <FieldLabel className="font-light cursor-pointer">Lembrar de mim</FieldLabel>
                  </Field>
                )}
              />

              <Link
                to={routes.FORGOT_PASSWORD.path}
                aria-label="Esqueci minha senha"
                className="text-sm font-light hover:underline underline-offset-4 decoration-teal-600">
                Esqueceu sua senha?
              </Link>
            </div>

            {form.formState.errors.root && (
              <p className="text-sm text-red-600">{form.formState.errors.root.message}</p>
            )}
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
