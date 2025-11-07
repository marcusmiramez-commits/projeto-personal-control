import { Toaster as Sonner, toast } from "sonner"

const Toaster = ({
  ...props
}) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-900 group-[.toaster]:border group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-slate-600",
          actionButton:
            "group-[.toast]:bg-emerald-500 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-slate-200 group-[.toast]:text-slate-900",
        },
      }}
      {...props} />
  );
}

export { Toaster, toast }
