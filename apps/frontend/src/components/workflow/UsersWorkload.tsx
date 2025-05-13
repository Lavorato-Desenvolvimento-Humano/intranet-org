// src/components/workflow/UsersWorkload.tsx
import React from "react";
import { UserWorkloadDto } from "@/types/workflow";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface UsersWorkloadProps {
  usersWorkload: UserWorkloadDto[];
}

const UsersWorkload: React.FC<UsersWorkloadProps> = ({ usersWorkload }) => {
  // Verificar se a lista está vazia ou é undefined
  if (!usersWorkload || usersWorkload.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <p className="text-center text-gray-500">
          Nenhum dado de carga de trabalho disponível
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <h3 className="text-lg font-semibold p-4 border-b">
        Carga de Trabalho dos Usuários
      </h3>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuário
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Atribuições Ativas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pendentes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Atrasadas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Carga
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {usersWorkload.map((user) => {
              // Garantir que user.userId não seja undefined
              if (!user.userId) return null;

              // Valores seguros com fallbacks
              const userName = user.userName || "Usuário";
              const userEmail = user.userEmail || "";
              const profileImage = user.profileImage || "";
              const activeAssignmentsCount = user.activeAssignmentsCount || 0;
              const pendingAssignmentsCount = user.pendingAssignmentsCount || 0;
              const overdueAssignmentsCount = user.overdueAssignmentsCount || 0;
              const workloadPercentage = user.workloadPercentage || 0;
              const isOverloaded = user.isOverloaded || false;

              return (
                <tr
                  key={user.userId.toString()}
                  className={isOverloaded ? "bg-red-50" : ""}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt={userName}
                          className="h-8 w-8 rounded-full mr-2"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center mr-2">
                          <span className="text-sm text-gray-600">
                            {userName.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {userName}
                        </div>
                        <div className="text-xs text-gray-500">{userEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {activeAssignmentsCount}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {pendingAssignmentsCount}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {overdueAssignmentsCount > 0 ? (
                      <div className="flex items-center text-sm text-red-500">
                        <AlertTriangle size={16} className="mr-1" />
                        {overdueAssignmentsCount}
                      </div>
                    ) : (
                      <div className="flex items-center text-sm text-green-500">
                        <CheckCircle size={16} className="mr-1" />0
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="bg-gray-200 rounded-full h-2.5 w-32 mr-2">
                        <div
                          className={`h-2.5 rounded-full ${
                            workloadPercentage > 90
                              ? "bg-red-500"
                              : workloadPercentage > 70
                                ? "bg-orange-500"
                                : "bg-green-500"
                          }`}
                          style={{ width: `${workloadPercentage}%` }}></div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {Math.round(workloadPercentage)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}

            {usersWorkload.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Nenhum dado de carga de trabalho disponível
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersWorkload;
