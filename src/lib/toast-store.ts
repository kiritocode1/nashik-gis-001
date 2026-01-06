import { useState, useEffect } from "react"

export type ToastType = "normal" | "success" | "destructive"

export interface Toast {
    id: string
    message: string
    type: ToastType
    duration?: number
}

type ToastListener = (toasts: Toast[]) => void

let toasts: Toast[] = []
let listeners: ToastListener[] = []

const MAX_TOASTS = 3

export const toastStore = {
    add: (toast: Omit<Toast, "id">) => {
        const id = Math.random().toString(36).substring(2, 9)
        const newToast = { ...toast, id }

        // If we already have MAX_TOASTS, remove the oldest one
        if (toasts.length >= MAX_TOASTS) {
            toasts = toasts.slice(1)
        }

        toasts = [...toasts, newToast]
        emitChange()
        return id
    },
    dismiss: (id: string) => {
        toasts = toasts.filter((t) => t.id !== id)
        emitChange()
    },
    subscribe: (listener: ToastListener) => {
        listeners.push(listener)
        return () => {
            listeners = listeners.filter((l) => l !== listener)
        }
    },
}

function emitChange() {
    listeners.forEach((listener) => listener(toasts))
}

export const toast = {
    success: (message: string, duration = 4000) =>
        toastStore.add({ message, type: "success", duration }),
    error: (message: string, duration = 4000) =>
        toastStore.add({ message, type: "destructive", duration }),
    normal: (message: string, duration = 4000) =>
        toastStore.add({ message, type: "normal", duration }),
}

export function useToast() {
    const [activeToasts, setActiveToasts] = useState<Toast[]>(toasts)

    useEffect(() => {
        return toastStore.subscribe(setActiveToasts)
    }, [])

    return { toasts: activeToasts, dismiss: toastStore.dismiss }
}