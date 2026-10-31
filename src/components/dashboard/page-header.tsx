interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode; // ações (botões)
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.04em] text-[#20352d] sm:text-[30px]">{title}</h1>
        {description && <p className="text-[13px] leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
