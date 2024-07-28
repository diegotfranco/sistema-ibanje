import { ReactNode, useEffect } from "react";
import { useAuth } from "hooks/AuthProvider";
import { useNavigate } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const navigate = useNavigate();
  console.log(auth);

  useEffect(() => {
    if (auth === null) navigate("/login", { replace: true });
  }, [navigate, auth]);

  return children;
}
