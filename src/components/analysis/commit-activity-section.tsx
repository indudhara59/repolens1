import { getCommitActivity } from "@/lib/github";
import type { RepoRef } from "@/types/github";
import { SectionCard, SectionEmpty, SectionError } from "./section-states";
import { CommitActivityChart } from "./commit-activity-chart";

export async function CommitActivitySection({
  owner,
  repo,
  refString,
}: RepoRef & { refString: string }) {
  try {
    const activity = await getCommitActivity({ owner, repo }, refString);
    if (activity.length === 0) {
      return (
        <SectionEmpty title="Commit Activity" message="No recent commit history found." />
      );
    }
    return (
      <SectionCard title="Commit Activity (weekly, leading up to this ref)">
        <CommitActivityChart data={activity} />
      </SectionCard>
    );
  } catch (error) {
    return <SectionError title="Commit Activity" error={error} />;
  }
}
