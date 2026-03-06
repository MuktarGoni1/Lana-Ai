import { redirect } from "next/navigation";

type LessonRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function LessonRouteRedirect({ params }: LessonRouteProps) {
  const { id } = await params;
  redirect(`/lesson/${id}/learn`);
}
