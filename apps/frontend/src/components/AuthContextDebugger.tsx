import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

// Definindo interface para o tipo de dados do localStorage
interface LocalStorageData {
  token: string | null;
  user: any | null;
}

const AuthContextDebugger = () => {
  const auth = useAuth();
  const [localStorageData, setLocalStorageData] = useState<LocalStorageData>({
    token: null,
    user: null,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");

      setLocalStorageData({
        token: token,
        user: user ? JSON.parse(user) : null,
      });
    }
  }, [auth.user]);

  const clearStorage = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setLocalStorageData({
      token: null,
      user: null,
    });
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Auth Context Debug</h2>
        <button
          onClick={clearStorage}
          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">
          Limpar Storage
        </button>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold text-gray-700 mb-2">Status:</h3>
        <div className="flex items-center mb-2">
          <span className="mr-2">Autenticado:</span>
          <span
            className={`px-2 py-1 rounded ${auth.user ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {auth.user ? "Sim" : "Não"}
          </span>
        </div>
        <div className="flex items-center">
          <span className="mr-2">Carregando:</span>
          <span
            className={`px-2 py-1 rounded ${auth.loading ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
            {auth.loading ? "Sim" : "Não"}
          </span>
        </div>
      </div>

      {auth.user && (
        <div className="mb-4">
          <h3 className="font-semibold text-gray-700 mb-2">
            Usuário Autenticado:
          </h3>
          <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-40">
            {JSON.stringify(auth.user, null, 2)}
          </pre>
        </div>
      )}

      <div className="mb-4">
        <h3 className="font-semibold text-gray-700 mb-2">localStorage:</h3>
        <div className="mb-2">
          <h4 className="text-sm font-medium text-gray-600 mb-1">Token:</h4>
          {localStorageData.token ? (
            <div className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-20 break-all">
              {localStorageData.token}
            </div>
          ) : (
            <div className="text-red-500 text-sm">Não há token armazenado</div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-1">User:</h4>
          {localStorageData.user ? (
            <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(localStorageData.user, null, 2)}
            </pre>
          ) : (
            <div className="text-red-500 text-sm">
              Não há usuário armazenado
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-700 mb-2">
          Métodos Disponíveis:
        </h3>
        <ul className="list-disc list-inside text-sm text-gray-600">
          <li>login(credentials)</li>
          <li>register(data)</li>
          <li>logout()</li>
          <li>requestPasswordReset(email)</li>
          <li>verifyResetCode(email, code)</li>
          <li>resetPassword(data)</li>
        </ul>
      </div>
    </div>
  );
};

export default AuthContextDebugger;
