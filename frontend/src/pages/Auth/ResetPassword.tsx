import HandFinanceGraph from '@/components/icons/HandFinanceGraph';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { PasswordInput } from '@/components/PasswordInput';
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import routes from '@/enums/routes.enum';
import { useResetPasswordForm } from '@/hooks/useResetPasswordForm';

const ResetPassword = () => {
  const { form, onSubmit, isPending } = useResetPasswordForm();

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
            <h2 className="text-teal-600">Redefinir sua senha?</h2>
            <Link
              to={routes.LOGIN.path}
              className="text-sm font-light text-slate-600 hover:underline underline-offset-4 decoration-teal-600">
              Voltar para o login
            </Link>
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Senha</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder="********" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Confirmar Senha</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder="********" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <PasswordStrengthMeter password={form.watch('password')} />
          </div>

          <Button type="submit" disabled={isPending} className="w-full mt-6 bg-teal-700 hover:bg-teal-800">
            {isPending ? 'Atualizando senha...' : 'Confirmar nova senha'}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
};

export default ResetPassword;
