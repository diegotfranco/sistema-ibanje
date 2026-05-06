import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Toaster } from '@/components/ui/sonner';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layouts/AppLayout';
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
console.log(flat);

const publicRoutes = flat.filter((r) => r.layout === 'auth');
const protectedRoutes = flat.filter((r) => r.layout === 'app');

function ToasterWrapper() {
  const { resolved } = useTheme();
  return <Toaster position="top-right" richColors theme={resolved} />;
}

export default function App() {
  return (
    <BrowserRouter>
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
