// components/ui/github-restriction-notice.tsx
import React from "react";
import { InfoIcon } from "lucide-react";

export const GitHubRestrictionNotice: React.FC = () => {
  return (
    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start">
      <InfoIcon className="text-blue-500 h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
      <div className="text-xs text-blue-800">
        <p className="font-medium mb-1">Nota sobre acesso GitHub:</p>
        <p>
          O login via GitHub está disponível apenas para os usuários
          específicos:
          <span className="font-semibold"> ViniciusG03</span> e
          <span className="font-semibold"> JooWilliams</span>.
        </p>
      </div>
    </div>
  );
};

export default GitHubRestrictionNotice;
