type LoadingStateProps = {
  lines?: number;
  cardHeight?: string;
  className?: string;
};

export const LoadingState = ({ lines = 3, cardHeight = "h-24", className = "" }: LoadingStateProps) => (
  <div className={`space-y-3 ${className}`.trim()} aria-hidden="true">
    {Array.from({ length: lines }).map((_, index) => (
      <div key={index} className={`app-loading-block ${cardHeight}`} />
    ))}
  </div>
);
