import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-emerald-700 text-white shadow hover:bg-emerald-800 hover:shadow-md",
        destructive:
          "bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md",
        outline:
          "border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 hover:text-slate-900 border-emerald-700/20",
        secondary:
          "bg-emerald-100 text-emerald-900 hover:bg-emerald-200",
        ghost:
          "text-slate-700 hover:bg-emerald-50 hover:text-emerald-900",
        link:
          "text-emerald-700 underline-offset-4 hover:underline",
        gold:
          "bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white shadow-md hover:from-amber-600 hover:to-amber-800 shadow-amber-500/20",
        emeraldGradient:
          "bg-gradient-to-r from-emerald-700 to-emerald-900 text-white shadow-md hover:from-emerald-800 hover:to-emerald-950 shadow-emerald-800/25",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
