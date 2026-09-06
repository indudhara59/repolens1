import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RepoMeta } from "@/types/github";

interface RepoHeaderProps {
  meta: RepoMeta;
  refString?: string;
}

export function RepoHeader({ meta, refString }: RepoHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Image
          src={meta.ownerAvatarUrl}
          alt={meta.owner}
          width={32}
          height={32}
          className="rounded-full"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/repo/${meta.owner}/${meta.repo}`}
            className="font-semibold hover:underline"
          >
            {meta.fullName}
          </Link>
          {refString && <Badge variant="secondary">{refString}</Badge>}
          <a
            href={meta.htmlUrl}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground"
            aria-label="Open on GitHub"
          >
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        change repo
      </Link>
    </div>
  );
}
