"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  IngestUrlRequestSchema,
  IngestTextRequestSchema,
  IngestYoutubeRequestSchema,
} from "../schemas/ingestion.schemas";
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
import {
  useIngestUrl,
  useIngestText,
  useIngestPdf,
  useIngestYoutube,
} from "../hooks";
import { getApiErrorMessage } from "@/lib/api-client";
import { FileText, Link, Youtube, Type, Upload } from "lucide-react";

type IngestionModalProps = {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  onSuccessAction?: () => void;
  defaultTab?: IngestionTab;
};

type UrlFormValues = {
  url: string;
};

type TextFormValues = {
  title: string;
  content: string;
};

type PdfFormValues = {
  title: string;
  file: FileList | null;
};

const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;

const PdfFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  file: z
    .custom<FileList | null>(
      (value) =>
        typeof FileList !== "undefined" &&
        value instanceof FileList &&
        value.length > 0,
      "File is required",
    )
    .nullable(),
});

type YoutubeFormValues = {
  url: string;
};

export type IngestionTab = "url" | "text" | "pdf" | "youtube";

function isIngestionTab(v: string): v is IngestionTab {
  return v === "url" || v === "text" || v === "pdf" || v === "youtube";
}

export function IngestionModal({
  open,
  onOpenChangeAction,
  onSuccessAction,
  defaultTab = "url",
}: IngestionModalProps) {
  const [activeTab, setActiveTab] = useState<IngestionTab>(defaultTab);
  const [clientError, setClientError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab, open]);

  const urlForm = useForm<UrlFormValues>({
    resolver: zodResolver(IngestUrlRequestSchema),
    defaultValues: { url: "" },
  });

  const textForm = useForm<TextFormValues>({
    resolver: zodResolver(IngestTextRequestSchema),
    defaultValues: { title: "", content: "" },
  });

  const pdfForm = useForm<PdfFormValues>({
    resolver: zodResolver(PdfFormSchema),
    defaultValues: {
      title: "",
      file: null,
    },
  });

  const youtubeForm = useForm<YoutubeFormValues>({
    resolver: zodResolver(IngestYoutubeRequestSchema),
    defaultValues: { url: "" },
  });

  const ingestUrl = useIngestUrl();
  const ingestText = useIngestText();
  const ingestPdf = useIngestPdf();
  const ingestYoutube = useIngestYoutube();

  const handleSuccess = () => {
    urlForm.reset();
    textForm.reset();
    pdfForm.reset();
    youtubeForm.reset();
    onOpenChangeAction(false);
    setClientError(null);
    onSuccessAction?.();
  };

  const onUrlSubmit = (data: UrlFormValues) => {
    ingestUrl.mutate(data, { onSuccess: handleSuccess });
  };

  const onTextSubmit = (data: TextFormValues) => {
    ingestText.mutate(data, { onSuccess: handleSuccess });
  };

  const onPdfSubmit = async (data: PdfFormValues) => {
    if (!data.file || data.file.length === 0) return;

    const file = data.file[0];
    if (!file) return;
    if (file.size > MAX_PDF_SIZE_BYTES) {
      setClientError("PDF is too large. Max size is 10 MB.");
      return;
    }
    setClientError(null);
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      const base64 = reader.result;
      const fileBase64 = base64.split(",")[1]; // Remove data:application/pdf;base64,

      ingestPdf.mutate(
        { title: data.title, fileBase64 },
        {
          onSuccess: () => {
            handleSuccess();
            if (fileInputRef.current) fileInputRef.current.value = "";
          },
        },
      );
    };

    reader.readAsDataURL(file);
  };

  const onYoutubeSubmit = (data: YoutubeFormValues) => {
    ingestYoutube.mutate(data, {
      onSuccess: handleSuccess,
    });
  };

  const isPending =
    ingestUrl.isPending ||
    ingestText.isPending ||
    ingestPdf.isPending ||
    ingestYoutube.isPending;

  const error =
    ingestUrl.error ||
    ingestText.error ||
    ingestPdf.error ||
    ingestYoutube.error;

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="sm:max-w-137.5" data-testid="ingestion-modal">
        <DialogHeader>
          <DialogTitle>Add New Document</DialogTitle>
          <DialogDescription>
            Expand your knowledge base with web articles, documents, or videos.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            if (!isIngestionTab(v)) return;
            setActiveTab(v);
            setClientError(null);
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="url" title="URL">
              <Link className="h-4 w-4 mr-2" />
              URL
            </TabsTrigger>
            <TabsTrigger value="text" title="Text">
              <Type className="h-4 w-4 mr-2" />
              Text
            </TabsTrigger>
            <TabsTrigger value="pdf" title="PDF">
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </TabsTrigger>
            <TabsTrigger value="youtube" title="YouTube">
              <Youtube className="h-4 w-4 mr-2" />
              YT
            </TabsTrigger>
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
                {renderActionButtons(
                  () => onOpenChangeAction(false),
                  isPending,
                )}
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
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Raw Text Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Paste your text here..."
                          className="min-h-37.5"
                          {...field}
                          data-testid="ingest-text-content"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {renderActionButtons(
                  () => onOpenChangeAction(false),
                  isPending,
                )}
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="pdf" className="mt-4">
            <Form {...pdfForm}>
              <form
                onSubmit={pdfForm.handleSubmit(onPdfSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={pdfForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Research Paper" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={pdfForm.control}
                  name="file"
                  render={({
                    field: { onChange, value: _value, ...field },
                  }) => (
                    <FormItem>
                      <FormLabel>PDF File</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            {...field}
                            ref={(e) => {
                              field.ref(e);
                              fileInputRef.current = e;
                            }}
                            onChange={(e) => {
                              onChange(e.target.files ?? null);
                              setClientError(null);
                            }}
                          />
                          <PdfFileNameDisplay
                            control={pdfForm.control}
                            onClick={() => fileInputRef.current?.click()}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {renderActionButtons(
                  () => onOpenChangeAction(false),
                  isPending,
                )}
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="youtube" className="mt-4">
            <Form {...youtubeForm}>
              <form
                onSubmit={youtubeForm.handleSubmit(onYoutubeSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={youtubeForm.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://youtube.com/watch?v=..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogDescription className="pb-2">
                  We will automatically extract and process the transcript from
                  this video.
                </DialogDescription>
                {renderActionButtons(
                  () => onOpenChangeAction(false),
                  isPending,
                )}
              </form>
            </Form>
          </TabsContent>

          {(clientError || error) && (
            <p className="mt-2 text-sm font-medium text-destructive">
              {clientError ?? getApiErrorMessage(error)}
            </p>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function renderActionButtons(onCancel: () => void, isPending: boolean) {
  return (
    <div className="flex justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isPending}
      >
        Cancel
      </Button>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Ingesting..." : "Ingest Document"}
      </Button>
    </div>
  );
}

function PdfFileNameDisplay({
  control,
  onClick,
}: {
  control: Control<PdfFormValues>;
  onClick: () => void;
}) {
  const file = useWatch({
    control,
    name: "file",
  });

  const fileName = file?.[0]?.name || "Choose PDF file";

  return (
    <Button
      type="button"
      variant="secondary"
      className="w-full h-24 border-2 border-dashed flex flex-col items-center justify-center gap-2"
      onClick={onClick}
    >
      <Upload className="h-6 w-6 text-muted-foreground" />
      <span>{fileName}</span>
    </Button>
  );
}
