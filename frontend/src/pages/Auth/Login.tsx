import HandFinanceGraph from '@/components/icons/HandFinanceGraph';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/PasswordInput';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Link, Navigate } from 'react-router';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { useLoginForm } from '@/hooks/useLoginForm';
import { useAuthStore } from '@/stores/useAuthStore';

const Login = () => {
  const { form, onSubmit, isPending } = useLoginForm();
  const { user } = useAuthStore();

  if (user) return <Navigate to="/" replace />;

  return (
    <AuthLayout illustration={<HandFinanceGraph className="text-slate-50 max-w-xs" />}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="w-full max-w-sm bg-white rounded-2xl shadow-md p-6">
          <header className="mb-8 text-center">
            <h1 className="text-2xl font-light underline underline-offset-8 decoration-teal-600 decoration-1">
              Tesouraria Ibanje
            </h1>
          </header>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg text-teal-600">Login</h2>
            <Link
              to="/cadastro"
              className="text-sm font-light text-slate-700 hover:underline underline-offset-4 decoration-teal-600">
              Não tem uma conta?
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
                      maxLength={100}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Senha</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder="********" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Remember Me + Forgot Password */}
            <div className="flex items-center justify-between">
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="h-4 w-4 cursor-pointer data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-light text-slate-700 cursor-pointer">
                      Lembrar de mim
                    </FormLabel>
                  </FormItem>
                )}
              />

              <Link
                to="/#"
                aria-label="Esqueci minha senha"
                className="text-sm font-light text-slate-700 hover:underline underline-offset-4 decoration-teal-600">
                Esqueceu sua senha?
              </Link>
            </div>
          </div>

          <Button type="submit" disabled={isPending} className="w-full mt-6 bg-teal-700 hover:bg-teal-800">
            {isPending ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
};

export default Login;
