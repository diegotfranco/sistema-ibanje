import HandFinanceGraph from '@/components/icons/HandFinanceGraph';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/PasswordInput';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { useCadastroForm } from '@/hooks/useCadastroForm';
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter';

const Cadastro = () => {
  const { form, onSubmit, isPending } = useCadastroForm();

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
            <h2 className="text-lg text-teal-600">Cadastro</h2>
            <Link
              to="/login"
              className="text-sm font-light text-slate-600 hover:underline underline-offset-4 decoration-teal-600">
              Já possui conta?
            </Link>
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Seu nome completo" autoComplete="name" maxLength={100} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
            <PasswordStrengthMeter
              password={form.watch('password')}
              userName={form.watch('name')}
              userEmail={form.watch('email')}
            />
          </div>

          <Button type="submit" disabled={isPending} className="w-full mt-6 bg-teal-700 hover:bg-teal-800">
            {isPending ? 'Criando conta...' : 'Criar Conta'}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
};

export default Cadastro;
