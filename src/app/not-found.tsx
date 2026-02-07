import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <p className="mt-4 text-xl text-gray-600">找不到頁面</p>
      <p className="mt-2 text-gray-500">
        您所尋找的頁面不存在，可能已被移除或網址有誤。
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-lg bg-primary px-6 py-3 text-white transition-colors hover:bg-primary-light"
      >
        返回首頁
      </Link>
    </div>
  );
}
