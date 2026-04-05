import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/common/Button";
import { FeedbackBanner } from "../../components/common/FeedbackBanner";
import { Input } from "../../components/common/Input";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { notifySuccess, notifyError } = useNotifications();
  const [form, setForm] = useState({
    clubName: "",
    clubSlug: "",
    adminName: "",
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      await register(form);
      notifySuccess("Clube criado", "Seu acesso inicial foi criado com sucesso.");
      navigate("/dashboard");
    } catch {
      const message = "Não foi possível criar a conta.";
      setError(message);
      notifyError("Falha no cadastro", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.28em] text-[#edc17a]">Onboarding</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">Criar clube</h1>
      <p className="mt-3 text-sm leading-7 text-slate-400">Preencha os dados do clube para começar a usar a plataforma.</p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {Object.entries({
          clubName: "Nome do clube",
          clubSlug: "Identificador do clube",
          adminName: "Nome do responsável",
          email: "E-mail",
          password: "Senha",
        }).map(([key, label]) => (
          <Input
            key={key}
            label={label}
              placeholder={label}
              type={key === "password" ? "password" : key === "email" ? "email" : "text"}
              autoComplete={key === "password" ? "new-password" : key === "email" ? "email" : "off"}
              minLength={key === "password" ? 8 : undefined}
              value={form[key as keyof typeof form]}
              onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
              required
          />
        ))}
        {error ? <FeedbackBanner tone="error" message={error} /> : null}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Criando..." : "Criar conta"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-slate-400">
        Já possui acesso? <Link to="/login" className="text-[#edc17a] transition hover:text-white">Entrar</Link>
      </p>
    </div>
  );
};
