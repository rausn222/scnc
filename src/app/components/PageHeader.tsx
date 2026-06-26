import React from "react";
import type { ReactNode } from "react";


export interface PageHeaderBreadcrumb {
  label: string;
  onClick?: () => void;
}

export interface PageHeaderProps {
  title: string;
  breadcrumbs?: PageHeaderBreadcrumb[];
  children?: ReactNode;
}

export function PageHeader({
  title,
  breadcrumbs,
  children,
}: PageHeaderProps) {
  return (
    <div
      className="px-5 py-3 shrink-0 flex items-center justify-between"
      style={{
        backgroundColor: "#003087",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <h2
            className="font-bold tracking-tight"
            style={{
              fontSize: 14,
              color: "#fff",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {title}
          </h2>

          {( breadcrumbs && breadcrumbs.length > 0) && (
            <div className="mt-0.5 flex flex-col gap-0.5">
             

              {breadcrumbs && breadcrumbs.length > 0 && (
                <nav
                  aria-label="Breadcrumb"
                  className="flex flex-wrap items-center gap-1 text-xs"
                  style={{ color: "#ffffff99" }}
                >
                  {breadcrumbs.map((item, index) => {
                    const isLast = index === breadcrumbs.length - 1;
                    return (
                      <span
                        key={`${item.label}-${index}`}
                        className="inline-flex items-center gap-1"
                      >
                        {index > 0 && (
                          <span
                            aria-hidden="true"
                            style={{ color: "#ffffff66" }}
                          >
                            ›
                          </span>
                        )}
                        {item.onClick && !isLast ? (
                          <button
                            type="button"
                            onClick={item.onClick}
                            className="transition-colors hover:underline"
                            style={{ color: "#ffffffcc" }}
                          >
                            {item.label}
                          </button>
                        ) : (
                          <span
                            style={{
                              color: isLast ? "#ffffff" : "#ffffff99",
                              fontWeight: isLast ? 600 : 400,
                            }}
                          >
                            {item.label}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </nav>
              )}
            </div>
          )}
        </div>
      </div>

      {children && (
        <div className="flex items-center gap-2 text-xs shrink-0 ml-4">
          {children}
        </div>
      )}
    </div>
  );
}
