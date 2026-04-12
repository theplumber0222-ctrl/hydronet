import { Suspense } from "react";
import { RegisterForm } from "./RegisterForm";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex max-w-md flex-1 flex-col justify-center px-4 py-16">
          <p className="text-slate-500">…</p>
        </main>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
