import { ReactNode } from "react";
import { Footer } from "@/components/ui/footer";

interface TestPageLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function TestPageLayout({ children, title, description }: TestPageLayoutProps) {
  return (
    <div className="p-8 min-h-screen flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        {description && <p className="text-slate-600">{description}</p>}
      </div>

      {children}

      <Footer />
    </div>
  );
}
