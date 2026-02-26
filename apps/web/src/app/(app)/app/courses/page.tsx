"use client";

import { useState } from "react";
import { useCollection, useCollections } from "@/features/collections/hooks";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getApiErrorMessage } from "@/lib/api-client";
import { ArrowLeft, Lock } from "lucide-react";
import { LEARNING_STATUS } from "@repo/shared-types";
import {
  AppPage,
  AppPageContent,
  AppPageDescription,
  AppPageHeader,
  AppPageHeading,
  AppPageTitle,
} from "@/components/layouts/app-page";
import { PageSkeleton } from "@/components/ui/page-skeleton";

function CourseDetail({
  courseId,
  onBackAction,
}: {
  courseId: string;
  onBackAction: () => void;
}) {
  const { data, isLoading, error } = useCollection(courseId);

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="courses-loading">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4" data-testid="courses-error">
        <Button variant="ghost" onClick={onBackAction} className="gap-2">
          <ArrowLeft className="size-4" />
          Back to courses
        </Button>
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {getApiErrorMessage(error)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const completed = data.items.filter(
    (item) => item.learningStatus === LEARNING_STATUS.COMPLETED,
  ).length;
  const percent =
    data.items.length === 0 ? 0 : (completed / data.items.length) * 100;

  return (
    <div className="space-y-6" data-testid="course-detail">
      <Button variant="ghost" onClick={onBackAction} className="gap-2">
        <ArrowLeft className="size-4" />
        Back to courses
      </Button>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{data.name}</h2>
        <p className="text-sm text-muted-foreground">
          {data.description ?? "No course description"}
        </p>
      </div>

      <div className="rounded-lg border p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Completion</span>
          <span>
            {completed}/{data.items.length}
          </span>
        </div>
        <Progress value={percent} />
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Syllabus
        </h2>
        {data.items.length === 0 && (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            No items in this course yet.
          </div>
        )}
        {data.items
          .sort((a, b) => a.order - b.order)
          .map((item) => (
            <div key={item.id} className="rounded-md border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{item.documentTitle}</p>
                <Badge variant="outline" className="text-[10px]">
                  {item.learningStatus}
                </Badge>
              </div>
              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                <span>Order {item.order + 1}</span>
                {item.prerequisiteId ? (
                  <span className="inline-flex items-center gap-1">
                    <Lock className="size-3" />
                    Has prerequisite
                  </span>
                ) : null}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default function CoursesPage() {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const { data, isLoading, error } = useCollections();

  return (
    <AppPage>
      <AppPageHeader>
        <AppPageHeading>
          <AppPageTitle>Courses</AppPageTitle>
          <AppPageDescription>
            Track ordered learning paths built on your collections.
          </AppPageDescription>
        </AppPageHeading>
      </AppPageHeader>
      <AppPageContent>
        {selectedCourseId ? (
          <CourseDetail
            courseId={selectedCourseId}
            onBackAction={() => setSelectedCourseId(null)}
          />
        ) : (
          <>
            {isLoading && (
              <PageSkeleton
                className="max-w-4xl"
                rows={2}
                data-testid="courses-loading"
              />
            )}

            {error && (
              <div
                className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
                data-testid="courses-error"
              >
                {getApiErrorMessage(error)}
              </div>
            )}

            {data && data.collections.length === 0 && (
              <div
                className="rounded-md border border-dashed p-4 text-sm text-muted-foreground"
                data-testid="courses-empty"
              >
                No courses available yet. Create a collection to get started.
              </div>
            )}

            {data && data.collections.length > 0 && (
              <div
                className="grid gap-3 sm:grid-cols-2"
                data-testid="courses-list"
              >
                {data.collections.map((course) => (
                  <button
                    key={course.id}
                    type="button"
                    className="rounded-lg border p-4 text-left hover:border-primary/40 transition-colors"
                    onClick={() => setSelectedCourseId(course.id)}
                  >
                    <p className="font-semibold">{course.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {course.description ?? "No description"}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{course.itemCount} items</span>
                      <span>{Math.round(course.progress)}% complete</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </AppPageContent>
    </AppPage>
  );
}
