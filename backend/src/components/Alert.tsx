import { useEffect, useState } from 'react'
import type { AlertProps } from '../types'
const alertStyles = {
    success: {
        container: 'bg-green-50 border border-green-200 text-green-800',
        icon: '✅',
        iconColor: 'text-green-500'
    },
    error: {
        container: 'bg-red-50 border border-red-200 text-red-800',
        icon: '❌',
        iconColor: 'text-red-500'
    },
    warning: {
        container: 'bg-yellow-50 border border-yellow-200 text-yellow-800',
        icon: '⚠️',
        iconColor: 'text-yellow-500'
    },
    info: {
        container: 'bg-blue-50 border border-blue-200 text-blue-800',
        icon: 'ℹ️',
        iconColor: 'text-blue-500'
    }
} as const

export default function Alert({
    type = 'info',
    title,
    message,
    onClose,
    autoClose = false,
    duration = 5000
}: AlertProps) {
    const [isVisible, setIsVisible] = useState<boolean>(true)
    const [isClosing, setIsClosing] = useState<boolean>(false)

    const style = alertStyles[type]

    useEffect(() => {
        if (autoClose) {
            const timer = setTimeout(() => {
                handleClose()
            }, duration)

            return () => clearTimeout(timer)
        }
    }, [autoClose, duration])

    const handleClose = (): void => {
        setIsClosing(true)
        setTimeout(() => {
            setIsVisible(false)
            if (onClose) onClose()
        }, 300) // Match the transition duration
    }

    if (!isVisible) return null

    return (
        <div className={`
      rounded-lg p-4 transition-all duration-300 transform
      ${style.container}
      ${isClosing ? 'opacity-0 scale-95 translate-y-2' : 'opacity-100 scale-100 translate-y-0'}
    `}>
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    <span className={`text-xl ${style.iconColor}`}>
                        {style.icon}
                    </span>
                </div>

                <div className="ml-3 flex-1">
                    {title && (
                        <h3 className="text-sm font-medium mb-1">
                            {title}
                        </h3>
                    )}
                    {message && (
                        <div className="text-sm opacity-90">
                            {message}
                        </div>
                    )}
                </div>

                {onClose && (
                    <div className="ml-auto pl-3">
                        <button
                            onClick={handleClose}
                            className={`
                inline-flex rounded-md p-1.5 transition-colors
                hover:bg-black hover:bg-opacity-10
                focus:outline-none focus:ring-2 focus:ring-offset-2
                ${type === 'success' ? 'focus:ring-green-500' :
                                    type === 'error' ? 'focus:ring-red-500' :
                                        type === 'warning' ? 'focus:ring-yellow-500' : 'focus:ring-blue-500'}
              `}
                            aria-label="Close alert"
                        >
                            <span className="text-lg leading-none">×</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}