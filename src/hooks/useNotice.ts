import { useState } from "react";

export function useNotice() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState<string>("Notice");
  const [message, setMessage] = useState<string | React.ReactNode>("");
  const [variant, setVariant] = useState<
    "info" | "success" | "warning" | "error"
  >("info");

  function show(opts: {
    title?: string;
    message: string | React.ReactNode;
    variant?: "info" | "success" | "warning" | "error";
  }) {
    setTitle(opts.title ?? "Notice");
    setMessage(opts.message);
    setVariant(opts.variant ?? "info");
    setOpen(true);
  }

  function hide() {
    setOpen(false);
  }

  return { open, title, message, variant, show, hide };
}
