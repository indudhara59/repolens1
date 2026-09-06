"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { parseGitHubUrl } from "@/lib/github-url";

export function RepoUrlForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ref = parseGitHubUrl(value);
    if (!ref) {
      setError('Enter a valid GitHub repo URL or "owner/repo".');
      return;
    }
    setError(null);
    router.push(`/repo/${ref.owner}/${ref.repo}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="github.com/vercel/next.js or owner/repo"
          aria-label="GitHub repository URL"
          autoFocus
        />
        <Button type="submit" className="sm:w-auto">
          Analyze repo
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
