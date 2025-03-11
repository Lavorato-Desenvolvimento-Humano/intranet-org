// components/LoginDebugger.tsx
import React, { useState } from "react";

// Definindo interfaces para os tipos
interface ErrorData {
  message: string;
  status?: number;
  data?: any;
}

interface AuthResponse {
  token: string;
  id: string;
  fullName: string;
  email: string;
  profileImage: string | null;
  roles: string[];
  type?: string;
}

const LoginDebugger = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<AuthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorData | null>(null);
  const [method, setMethod] = useState("standard"); // standard, simple, direta

  // Usar uma URL fixa em vez de variáveis de ambiente para evitar erros
  const baseUrl = "https://dev.lavorato.app.br/api";

  const testLogin = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    let url = "";
    switch (method) {
      case "simple":
        url = `${baseUrl}/auth/simple/login`;
        break;
      case "direta":
        url = `${baseUrl}/auth/direta/login`;
        break;
      default:
        url = `${baseUrl}/auth/login`;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Status: ${response.status} ${response.statusText}`, {
          cause: { status: response.status, data: errorData },
        });
      }

      const data = await response.json();
      setResult(data as AuthResponse);

      // Salvar dados no localStorage para simular o login completo
      if (data && "token" in data) {
        localStorage.setItem("token", data.token);
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: data.id,
            fullName: data.fullName,
            email: data.email,
            profileImage: data.profileImage,
            roles: data.roles,
            token: data.token,
          })
        );
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError({
        message: err instanceof Error ? err.message : String(err),
        status: (err as any).cause?.status,
        data: (err as any).cause?.data,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Login Debugger</h2>

      <div className="mb-6">
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setMethod("standard")}
            className={`px-3 py-1 rounded ${method === "standard" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
            Endpoint Padrão
          </button>
          <button
            onClick={() => setMethod("simple")}
            className={`px-3 py-1 rounded ${method === "simple" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
            Endpoint Simples
          </button>
          <button
            onClick={() => setMethod("direta")}
            className={`px-3 py-1 rounded ${method === "direta" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
            Endpoint Direto
          </button>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-1">
          URL de teste
        </label>
        <div className="mb-4 p-2 bg-gray-100 rounded text-sm font-mono break-all">
          {method === "simple"
            ? `${baseUrl}/auth/simple/login`
            : method === "direta"
              ? `${baseUrl}/auth/direta/login`
              : `${baseUrl}/auth/login`}
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="email@exemplo.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Senha
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Sua senha"
          />
        </div>
      </div>

      <button
        onClick={testLogin}
        disabled={loading}
        className="w-full py-2 px-4 bg-primary hover:bg-primary-dark text-white font-bold rounded transition-colors disabled:opacity-50">
        {loading ? "Testando..." : "Testar Login"}
      </button>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="font-bold text-red-700 mb-2">Erro</h3>
          <p className="text-red-600 mb-2">{error.message}</p>
          {error.status && (
            <p className="text-sm text-red-500">Status: {error.status}</p>
          )}
          {error.data && (
            <div className="mt-2">
              <p className="text-sm font-medium text-red-500">Resposta:</p>
              <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(error.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="font-bold text-green-700 mb-2">Sucesso</h3>
          <div className="mt-2">
            <p className="text-sm font-medium text-green-600">Token JWT:</p>
            <div className="mt-1 text-xs bg-green-100 p-2 rounded overflow-auto max-h-20 break-all">
              {result.token}
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-green-600">
              Resposta completa:
            </p>
            <pre className="mt-1 text-xs bg-green-100 p-2 rounded overflow-auto max-h-60">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginDebugger;
