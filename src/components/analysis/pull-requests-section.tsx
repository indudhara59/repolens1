import { listPullRequestsMergedBefore } from "@/lib/github";
import type { RepoRef } from "@/types/github";
import { SectionCard, SectionEmpty, SectionError } from "./section-states";
import { PrList } from "./pr-list";

export async function PullRequestsSection({
  owner,
  repo,
  refString,
  before,
}: RepoRef & { refString: string; before: string }) {
  try {
    const page1 = await listPullRequestsMergedBefore({ owner, repo }, before, {
      page: 1,
      perPage: 10,
    });
    if (page1.items.length === 0) {
      return (
        <SectionEmpty
          title="Pull Requests"
          message="No merged pull requests found before this point in history."
        />
      );
    }
    return (
      <SectionCard title="Pull Requests merged at or before this ref">
        <PrList owner={owner} repo={repo} refString={refString} initial={page1} />
      </SectionCard>
    );
  } catch (error) {
    return <SectionError title="Pull Requests" error={error} />;
  }
}
