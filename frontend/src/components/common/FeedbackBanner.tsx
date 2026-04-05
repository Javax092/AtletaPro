type FeedbackBannerProps = {
  tone?: "success" | "error" | "info";
  message: string;
};

const toneClassName = {
  success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
  error: "border-rose-400/20 bg-rose-400/10 text-rose-100",
  info: "border-sky-400/20 bg-sky-400/10 text-sky-100",
} as const;

const toneIndicator = {
  success: "OK",
  error: "ER",
  info: "IN",
} as const;

export const FeedbackBanner = ({ tone = "info", message }: FeedbackBannerProps) => (
  <div className={`rounded-2xl border px-4 py-3 text-sm ${toneClassName[tone]}`}>
    <div className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 text-[10px] font-semibold uppercase tracking-[0.12em]">
        {toneIndicator[tone]}
      </span>
      <p className="leading-6">{message}</p>
    </div>
  </div>
)
