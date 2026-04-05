import { FormEvent, useState } from "react";
import { AxiosError } from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/common/Button";
import { FeedbackBanner } from "../../components/common/FeedbackBanner";
import { Input } from "../../components/common/Input";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";

const getErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    const apiMessage = error.response?.data?.message;
    if (typeof apiMessage === "string" && apiMessage.trim().length > 0) {
      return apiMessage;
    }
  }

  return "Falha no login. Verifique as credenciais.";
};

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { notifySuccess, notifyError } = useNotifications();
  const [email, setEmail] = useState("admin@democlub.com");
  const [password, setPassword] = useState("password123");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      await login({ email, password });
      notifySuccess("Login concluído", "Seu clube foi carregado com sucesso.");
      navigate("/dashboard");
    } catch (error) {
      const message = getErrorMessage(error);
      setError(message);
      notifyError("Falha no login", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.28em] text-[#edc17a]">Acesso</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">Entrar no sistema</h1>
      <p className="mt-3 text-sm leading-7 text-slate-400">Acesse seu clube e acompanhe desempenho, jogos e análises em um só lugar.</p>
      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-400">
        Credenciais demo: <span className="text-white">admin@democlub.com</span> / <span className="text-white">password123</span>
      </div>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Input label="E-mail" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@clube.com" required />
        <Input label="Senha" type="password" autoComplete="current-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Digite sua senha" required />
        {error ? <FeedbackBanner tone="error" message={error} /> : null}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Entrando..." : "Entrar"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-slate-400">
        Novo clube? <Link to="/register" className="text-[#edc17a] transition hover:text-white">Criar conta</Link>
      </p>
    </div>
  );
};
