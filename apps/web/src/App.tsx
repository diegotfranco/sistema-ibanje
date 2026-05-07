import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Toaster } from '@/components/ui/sonner';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layouts/AppLayout';
import { AuthErrorListener } from '@/components/AuthErrorListener';
import { appRoutes, type AppRoute } from '@/routes';
import { paths } from '@/lib/paths';
import { useTheme } from '@/lib/theme';

function flattenRoutes(routes: AppRoute[]): AppRoute[] {
  return routes.flatMap((route) =>
    route.children && route.children.length > 0
      ? [route, ...flattenRoutes(route.children)]
      : [route]
  );
}

const flat = flattenRoutes(appRoutes);

const publicRoutes = flat.filter((r) => r.layout === 'auth' && r.path && r.element);
const protectedRoutes = flat.filter((r) => r.layout === 'app' && r.path && r.element);

function ToasterWrapper() {
  const { resolved } = useTheme();
  return <Toaster position="top-right" richColors theme={resolved} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthErrorListener />
      <ToasterWrapper />
      <Routes>
        {publicRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
          {protectedRoutes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>
        <Route path="*" element={<Navigate to={paths.login} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
