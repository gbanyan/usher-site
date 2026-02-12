"use client";

export default function Error({
  reset,
}: {
  error?: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center" role="alert" aria-live="assertive">
      <h1 className="text-4xl font-bold text-white">發生錯誤</h1>
      <p className="mt-4 text-lg text-gray-300">
        很抱歉，頁面載入時發生問題，請稍後再試。
      </p>
      <button
        onClick={reset}
        className="mt-8 inline-block cursor-pointer rounded-lg bg-accent px-6 py-3 text-white transition-colors hover:bg-accent-light"
        aria-label="重新載入頁面"
      >
        重新嘗試
      </button>
    </div>
  );
}
