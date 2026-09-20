export default function Loading() {
  return (
    <div className="flex min-h-screen bg-[#f8faf9]">
      <div className="hidden w-[250px] border-r border-slate-200 bg-white lg:block" />

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-[1400px]">
          <div className="animate-pulse">
            <div className="h-4 w-32 rounded bg-slate-200" />

            <div className="mt-3 h-9 w-80 rounded bg-slate-200" />

            <div className="mt-3 h-5 w-96 max-w-full rounded bg-slate-200" />

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-36 rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <div className="h-4 w-24 rounded bg-slate-200" />
                  <div className="mt-5 h-7 w-32 rounded bg-slate-200" />
                  <div className="mt-3 h-4 w-24 rounded bg-slate-200" />
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
              <div className="h-[390px] rounded-2xl border border-slate-200 bg-white" />
              <div className="h-[390px] rounded-2xl border border-slate-200 bg-white" />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
              <div className="h-[350px] rounded-2xl border border-slate-200 bg-white" />
              <div className="h-[350px] rounded-2xl border border-slate-200 bg-white" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}