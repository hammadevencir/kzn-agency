import { HelpIcon } from "@/components/icons";

export default function CreateArticlePage() {
  return (
    <div className="flex flex-1 items-center justify-center min-h-[70vh] p-6">
      <div className="max-w-md text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <HelpIcon className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold text-white">Create KZN article</h1>
        <p className="text-quaternary text-sm leading-relaxed">
          This is where you&apos;ll write and publish educational articles for the
          Help Center — so customers can learn more about META and other topics.
          Article authoring is coming soon.
        </p>
      </div>
    </div>
  );
}
