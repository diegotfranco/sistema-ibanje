import HandFinanceGraph from '@/components/icons/HandFinanceGraph';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { InputPassword } from '@/components/InputPassword';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Link, Navigate } from 'react-router';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { useLoginForm } from '@/hooks/useLoginForm';
import { useAuthStore } from '@/stores/useAuthStore';

const Login = () => {
  const { form, onSubmit, showPassword, toggleShowPassword, isPending } = useLoginForm();

  const { user } = useAuthStore();
  if (user) return <Navigate to="/" replace />;

  return (
    <AuthLayout illustration={<HandFinanceGraph className="text-slate-50" />}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full max-w-sm bg-white rounded-2xl shadow-md p-6">
          <h1 className="font-light text-center text-2xl underline underline-offset-8 decoration-teal-600 decoration-1 mb-8">
            Tesouraria Ibanje
          </h1>

          <div className="flex justify-between items-center">
            <h2 className="text-lg text-teal-600 mb-4">Login</h2>
            <Link to="/cadastro" className="font-light text-slate-600 text-sm mb-4 block">
              Não tem uma conta?
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="exemplo@mail.com" {...field} />
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
                    <InputPassword
                      placeholder="********"
                      {...field}
                      showPassword={showPassword}
                      onToggleShowPassword={toggleShowPassword}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                        className="data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600 cursor-pointer h-4 w-4"
                      />
                    </FormControl>
                    <FormLabel className="text-slate-600 text-sm font-light cursor-pointer">
                      Lembrar de mim
                    </FormLabel>
                  </FormItem>
                )}
              />
              <Link to="#" className="text-slate-600 text-sm font-light underline-offset-4 hover:underline">
                Esqueceu sua senha?
              </Link>
            </div>
          </div>

          <Button type="submit" className="w-full mt-6 bg-teal-700 hover:bg-teal-800" disabled={isPending}>
            {isPending ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
};

export default Login;
