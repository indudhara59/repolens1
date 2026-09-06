"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
      <Card className="w-full">
        <CardHeader className="items-center">
          <CircleAlert className="size-8 text-destructive" />
          <CardTitle>Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred. You can try again, or head back home.
          </p>
          <div className="flex justify-center gap-2">
            <Button onClick={reset}>Try again</Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/">Go home</Link>}
            />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
