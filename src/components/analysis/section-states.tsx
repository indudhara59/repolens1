import { CircleAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GitHubServiceError } from "@/types/github";

export function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function SectionEmpty({ title, message }: { title: string; message: string }) {
  return (
    <SectionCard title={title}>
      <p className="py-4 text-center text-sm text-muted-foreground">{message}</p>
    </SectionCard>
  );
}

export function SectionError({ title, error }: { title: string; error: unknown }) {
  const message =
    error instanceof GitHubServiceError
      ? error.message
      : "Something went wrong loading this section.";
  return (
    <SectionCard title={title}>
      <Alert variant="destructive">
        <CircleAlert />
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </SectionCard>
  );
}
