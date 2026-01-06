"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { X } from "lucide-react"
import { useEffect, useState } from "react"
import AlertIcon from "../icons/alert"
import CheckIcon from "../icons/check"
import InfoIcon from "../icons/info"
import { Toast } from "@/lib/toast-store"

interface ToastProps {
    toast: Toast
    onDismiss: (id: string) => void
    position?: string
}

export function ToastItem({ toast, onDismiss, position = "bottom-right" }: ToastProps) {
    const [isPaused, setIsPaused] = useState(false)
    const duration = toast.duration || 5000
    const [remaining, setRemaining] = useState(duration)

    useEffect(() => {
        if (isPaused) return

        const timer = setTimeout(() => {
            onDismiss(toast.id)
        }, remaining)

        const start = Date.now()

        return () => {
            clearTimeout(timer)
            const elapsed = Date.now() - start
            setRemaining((prev) => Math.max(0, prev - elapsed))
        }
    }, [isPaused, onDismiss, toast.id])

    const isTop = position.includes("top")

    const variants = {
        initial: { opacity: 0, y: isTop ? -50 : 50, scale: 0.9 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
    }

    const getIcon = () => {
        switch (toast.type) {
            case "success":
                return <CheckIcon />
            case "destructive":
                return <AlertIcon />
            default:
                return <InfoIcon />
        }
    }

    const getStyles = () => {
        switch (toast.type) {
            case "success":
                return "bg-emerald-600 text-white pl-[6px] pr-1.5 py-1.5 border border-emerald-500/50"
            case "destructive":
                return "bg-red-600 text-white pl-[6px] pr-1.5 py-1.5 border border-red-500/50"
            default:
                return "bg-zinc-900 text-white pl-5 pr-1.5 py-1.5 border border-zinc-800"
        }
    }

    return (
        <motion.div
            layout
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className={cn(
                "flex items-center justify-between w-auto max-w-sm rounded-full shadow-lg pointer-events-auto",
                getStyles()
            )}
        >
            <div className="flex items-center gap-3">
                {getIcon() && (
                    getIcon()
                )}
                <p className="text-sm font-medium whitespace-nowrap tracking-tight">{toast.message}</p>
            </div>

            <button
                onClick={() => onDismiss(toast.id)}
                className="relative cursor-pointer flex items-center justify-center size-7 ml-4 rounded-full bg-white/20 hover:bg-white/10 transition-colors"
            >
                <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                        className="text-white/20"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                    />
                    <path
                        className="text-white"
                        strokeDasharray="100, 100"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        style={{
                            animation: `countdown ${duration}ms linear forwards`,
                            animationPlayState: isPaused ? "paused" : "running",
                        }}
                    />
                </svg>
                <X className="size-4 text-white" />
            </button>
            <style jsx>{`
                @keyframes countdown {
                    from {
                        stroke-dashoffset: 0;
                    }
                    to {
                        stroke-dashoffset: 100;
                    }
                }
            `}</style>
        </motion.div>
    )
}