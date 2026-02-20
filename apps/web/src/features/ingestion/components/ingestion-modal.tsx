"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useIngestUrl, useIngestText } from "../hooks";
import { getApiErrorMessage } from "@/lib/api-client";

interface IngestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface UrlFormValues {
  url: string;
}

interface TextFormValues {
  title: string;
  content: string;
}

export function IngestionModal({
  open,
  onOpenChange,
  onSuccess,
}: IngestionModalProps) {
  const [activeTab, setActiveTab] = useState<"url" | "text">("url");

  const urlForm = useForm<UrlFormValues>({
    defaultValues: { url: "" },
  });

  const textForm = useForm<TextFormValues>({
    defaultValues: { title: "", content: "" },
  });

  const ingestUrl = useIngestUrl();
  const ingestText = useIngestText();

  const onUrlSubmit = (data: UrlFormValues) => {
    ingestUrl.mutate(data, {
      onSuccess: () => {
        urlForm.reset();
        onOpenChange(false);
        onSuccess?.();
      },
    });
  };

  const onTextSubmit = (data: TextFormValues) => {
    ingestText.mutate(data, {
      onSuccess: () => {
        textForm.reset();
        onOpenChange(false);
        onSuccess?.();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="ingestion-modal">
        <DialogHeader>
          <DialogTitle>Add New Document</DialogTitle>
          <DialogDescription>
            Provide a URL to scrape or paste raw text to ingest into the
            knowledge base.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "url" | "text")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url">URL</TabsTrigger>
            <TabsTrigger value="text">Raw Text</TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="mt-4">
            <Form {...urlForm}>
              <form
                onSubmit={urlForm.handleSubmit(onUrlSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={urlForm.control}
                  name="url"
                  rules={{ required: "URL is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/article"
                          {...field}
                          data-testid="ingest-url-input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {ingestUrl.error && (
                  <p className="text-sm font-medium text-destructive">
                    {getApiErrorMessage(ingestUrl.error)}
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={ingestUrl.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={ingestUrl.isPending}
                    data-testid="submit-url-btn"
                  >
                    {ingestUrl.isPending ? "Ingesting..." : "Ingest URL"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="text" className="mt-4">
            <Form {...textForm}>
              <form
                onSubmit={textForm.handleSubmit(onTextSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={textForm.control}
                  name="title"
                  rules={{ required: "Title is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="My Notes"
                          {...field}
                          data-testid="ingest-text-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={textForm.control}
                  name="content"
                  rules={{ required: "Content is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Raw Text Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Paste your text here..."
                          className="min-h-[150px]"
                          {...field}
                          data-testid="ingest-text-content"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {ingestText.error && (
                  <p className="text-sm font-medium text-destructive">
                    {getApiErrorMessage(ingestText.error)}
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={ingestText.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={ingestText.isPending}
                    data-testid="submit-text-btn"
                  >
                    {ingestText.isPending ? "Ingesting..." : "Ingest Text"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
