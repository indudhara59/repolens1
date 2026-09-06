import Link from "next/link";
import { SearchX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
      <Card className="w-full">
        <CardHeader className="items-center">
          <SearchX className="size-8 text-muted-foreground" />
          <CardTitle>Page not found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This repo, ref, or page doesn&apos;t exist — or it may have been mistyped.
          </p>
          <Button render={<Link href="/">Back home</Link>} nativeButton={false} />
        </CardContent>
      </Card>
    </main>
  );
}
