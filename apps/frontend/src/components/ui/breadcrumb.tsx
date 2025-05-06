// apps/frontend/src/components/ui/breadcrumb.tsx
import React from "react";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  showHome = true,
}) => {
  const handleNavigate = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = path;
  };

  return (
    <nav
      className="flex items-center space-x-2 text-sm mb-6"
      aria-label="Breadcrumb">
      {showHome && (
        <a
          href="/"
          className="text-gray-500 hover:text-primary flex items-center"
          onClick={handleNavigate("/")}>
          <Home size={16} className="mr-1" />
          <span>Início</span>
        </a>
      )}

      {showHome && items.length > 0 && (
        <ChevronRight size={14} className="text-gray-400" />
      )}

      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item.href ? (
            <a
              href={item.href}
              className={`hover:text-primary ${
                index === items.length - 1
                  ? "text-primary font-medium"
                  : "text-gray-500"
              }`}
              onClick={item.href ? handleNavigate(item.href) : undefined}>
              {item.label}
            </a>
          ) : (
            <span
              className={`${
                index === items.length - 1
                  ? "text-primary font-medium"
                  : "text-gray-500"
              }`}>
              {item.label}
            </span>
          )}

          {index < items.length - 1 && (
            <ChevronRight size={14} className="text-gray-400" />
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;
