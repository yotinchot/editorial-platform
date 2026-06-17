import type { Metadata } from "next";

import { NewPostForm } from "./new-post-form";

export const metadata: Metadata = {
  title: "New Post — Field Notes Admin",
  robots: { index: false, follow: false },
};

export default function NewPostPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl text-foreground">New Post</h2>
        <p className="mt-0.5 text-sm text-foreground/50">
          Give your post a title to get started. You can change it later.
        </p>
      </div>
      <NewPostForm />
    </div>
  );
}
