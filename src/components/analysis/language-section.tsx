import { getLanguages } from "@/lib/github";
import type { RepoRef } from "@/types/github";
import { SectionCard, SectionEmpty, SectionError } from "./section-states";
import { LanguageChart } from "./language-chart";

export async function LanguageSection({ owner, repo }: RepoRef) {
  try {
    const languages = await getLanguages({ owner, repo });
    if (languages.length === 0) {
      return <SectionEmpty title="Languages" message="No language data detected for this repo." />;
    }
    return (
      <SectionCard title="Languages">
        <LanguageChart data={languages} />
      </SectionCard>
    );
  } catch (error) {
    return <SectionError title="Languages" error={error} />;
  }
}
