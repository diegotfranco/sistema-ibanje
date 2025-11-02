import HandFinanceGraph from '@/components/icons/HandFinanceGraph';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link, Navigate } from 'react-router';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { useForgotPasswordForm } from '@/hooks/useForgotPasswordForm';
import { useAuthStore } from '@/stores/useAuthStore';
import routes from '@/enums/routes.enum';

const ForgotPassword = () => {
  const { form, onSubmit, isPending } = useForgotPasswordForm();
  const { user } = useAuthStore();

  if (user) return <Navigate to={routes.ROOT.path} replace />;

  return (
    <AuthLayout illustration={<HandFinanceGraph className="text-slate-50 max-w-xs" />}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="w-full max-w-sm bg-white rounded-2xl shadow-md p-6">
          <header className="mb-8 text-center">
            <h1 className="text-2xl font-light underline underline-offset-8 decoration-teal-600 decoration-1">
              Sistema Ibanje
            </h1>
          </header>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-teal-600">Esqueceu sua senha?</h2>
            <Link
              to={routes.LOGIN.path}
              className="text-sm font-light text-slate-600 hover:underline underline-offset-4 decoration-teal-600">
              Voltar para o login
            </Link>
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">E-mail</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="exemplo@mail.com"
                      autoComplete="email"
                      maxLength={96}
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" disabled={isPending} className="w-full mt-6 bg-teal-700 hover:bg-teal-800">
            {isPending ? 'Enviando...' : 'Enviar link de redefinição'}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
};

export default ForgotPassword;
