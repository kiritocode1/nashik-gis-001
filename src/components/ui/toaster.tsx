"use client"

import { useToast } from "@/lib/toast-store"
import { cn } from "@/lib/utils"
import { AnimatePresence } from "framer-motion"
import { ToastItem } from "./toast"

type ToasterProps = {
    position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"
}

export function Toaster({ position = "bottom-center" }: ToasterProps) {
    const { toasts, dismiss } = useToast()

    const getPositionStyles = () => {
        switch (position) {
            case "top-left":
                return "top-4 left-4 items-start"
            case "top-center":
                return "top-4 left-1/2 -translate-x-1/2 items-center"
            case "top-right":
                return "top-4 right-4 items-end"
            case "bottom-left":
                return "bottom-4 left-4 items-start"
            case "bottom-center":
                return "bottom-4 left-1/2 -translate-x-1/2 items-center"
            case "bottom-right":
                return "bottom-4 right-4 items-end"
            default:
                return "bottom-4 right-4 items-end"
        }
    }

    return (
        <div className={cn("fixed z-100 flex flex-col gap-2.5 pointer-events-none", getPositionStyles())}>
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} position={position} />
                ))}
            </AnimatePresence>
        </div>
    )
}