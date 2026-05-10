import type { ReactNode } from "react";
import { SectionCard } from "../ui/SectionCard";

interface ChartCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export const ChartCard = ({ title, subtitle, children }: ChartCardProps) => (
  <SectionCard title={title} subtitle={subtitle} className="h-full">
    <div className="h-72">{children}</div>
  </SectionCard>
);
