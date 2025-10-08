import HandFinanceGraph from '@/components/icons/HandFinanceGraph';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { InputPassword } from '@/components/InputPassword';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { useCadastroForm } from '@/hooks/useCadastroForm';

const Cadastro = () => {
  const { form, onSubmit, showPassword, toggleShowPassword } = useCadastroForm();

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
            <h2 className="text-lg text-teal-600 mb-4">Cadastro</h2>
            <Link to="/login" className="font-light text-slate-600 text-sm mb-4 block">
              Já possui conta?
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Seu nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
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

            {/* Password */}
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

            {/* Confirm Password */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Confirmar Senha</FormLabel>
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
          </div>

          <Button type="submit" className="w-full mt-6 bg-teal-700 hover:bg-teal-800">
            Criar Conta
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
};

export default Cadastro;
