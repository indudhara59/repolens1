import { RepoUrlForm } from "@/components/repo-url-form";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          RepoLens
        </h1>
        <p className="mx-auto max-w-xl text-balance text-muted-foreground">
          Paste any public GitHub repo URL to browse its releases, commits,
          pull requests, and issues — no login required.
        </p>
      </div>
      <RepoUrlForm />
    </main>
  );
}
