import { listContributors } from "@/lib/github";
import type { RepoRef } from "@/types/github";
import { SectionCard, SectionEmpty, SectionError } from "./section-states";
import { ContributorsChart } from "./contributors-chart";

export async function ContributorsSection({ owner, repo }: RepoRef) {
  try {
    const contributors = await listContributors({ owner, repo }, 10);
    if (contributors.length === 0) {
      return (
        <SectionEmpty
          title="Top Contributors"
          message="Contributor stats aren't available for this repo yet — try again shortly."
        />
      );
    }
    return (
      <SectionCard title="Top Contributors">
        <ContributorsChart data={contributors} />
      </SectionCard>
    );
  } catch (error) {
    return <SectionError title="Top Contributors" error={error} />;
  }
}
