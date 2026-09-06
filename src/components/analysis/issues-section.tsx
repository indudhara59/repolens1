import { listIssuesBefore } from "@/lib/github";
import type { RepoRef } from "@/types/github";
import { SectionCard, SectionEmpty, SectionError } from "./section-states";
import { IssueList } from "./issue-list";

export async function IssuesSection({
  owner,
  repo,
  refString,
  before,
}: RepoRef & { refString: string; before: string }) {
  try {
    const page1 = await listIssuesBefore({ owner, repo }, before, {
      state: "all",
      page: 1,
      perPage: 10,
    });
    if (page1.items.length === 0 && !page1.hasNextPage) {
      return (
        <SectionEmpty
          title="Issues"
          message="No issues found before this point in history."
        />
      );
    }
    return (
      <SectionCard title="Issues as of this ref">
        <IssueList owner={owner} repo={repo} refString={refString} initial={page1} />
      </SectionCard>
    );
  } catch (error) {
    return <SectionError title="Issues" error={error} />;
  }
}
