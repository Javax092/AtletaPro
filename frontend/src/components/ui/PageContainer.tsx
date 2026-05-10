import type { PropsWithChildren } from "react";

export const PageContainer = ({ children }: PropsWithChildren) => (
  <div className="space-y-8 px-4 py-5 sm:px-5 lg:px-7 lg:py-7">{children}</div>
);
