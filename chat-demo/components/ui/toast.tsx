'use client'

import * as React from 'react'
import * as ToastPrimitives from '@radix-ui/react-toast'
import { cva, type VariantProps } from 'class-variance-authority'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      'fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col p-4 sm:top-0 sm:right-0 sm:flex-col md:max-w-[420px]',
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-start gap-4 overflow-hidden rounded-xl border p-4 shadow-xl backdrop-blur-lg ring-1 ring-black/5 transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'bg-white/95 border-gray-200/60 text-gray-900 shadow-lg ring-gray-200/20',
        destructive:
          'bg-gradient-to-r from-red-50/95 to-pink-50/95 border-red-200/60 text-red-900 shadow-red-100/50 ring-red-200/30',
        success:
          'bg-gradient-to-r from-emerald-50/95 to-green-50/95 border-emerald-200/60 text-emerald-900 shadow-emerald-100/50 ring-emerald-200/30',
        warning:
          'bg-gradient-to-r from-amber-50/95 to-yellow-50/95 border-amber-200/60 text-amber-900 shadow-amber-100/50 ring-amber-200/30',
        info:
          'bg-gradient-to-r from-blue-50/95 to-indigo-50/95 border-blue-200/60 text-blue-900 shadow-blue-100/50 ring-blue-200/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

// Icon mapping for variants
const toastIcons = {
  default: Info,
  success: CheckCircle,
  destructive: AlertCircle,
  warning: AlertTriangle,
  info: Info,
} as const

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants> & {
      showIcon?: boolean
      fading?: boolean
    }
>(({ className, variant = 'default', showIcon = true, fading = false, children, ...props }, ref) => {
  const IconComponent = toastIcons[variant || 'default']
  
  return (
    <ToastPrimitives.Root
      ref={ref}
      asChild
      {...props}
    >
      <motion.div
        className={cn(toastVariants({ variant }), className)}
        initial={{ opacity: 0, x: 400, scale: 0.4, rotate: 2 }}
        animate={{ 
          opacity: fading ? 0.3 : 1, 
          x: 0, 
          scale: fading ? 0.95 : 1, 
          rotate: 0,
          transition: {
            type: fading ? "tween" : "spring",
            stiffness: 300,
            damping: 25,
            duration: fading ? 1 : undefined, // 1s fade out
            ease: fading ? "easeOut" : undefined
          }
        }}
        exit={{ 
          opacity: 0, 
          x: 400, 
          scale: 0.6, 
          rotate: -2,
          transition: { 
            duration: 0.25,
            ease: "easeInOut"
          } 
        }}
        whileHover={!fading ? { 
          scale: 1.02,
          transition: { duration: 0.2 }
        } : {}}
      >
        {showIcon && (
          <div className="flex-shrink-0 mt-0.5">
            <IconComponent className={cn(
              "h-5 w-5 transition-opacity duration-1000",
              fading && "opacity-40",
              variant === 'success' && "text-emerald-600",
              variant === 'destructive' && "text-red-600",
              variant === 'warning' && "text-amber-600",
              variant === 'info' && "text-blue-600",
              variant === 'default' && "text-gray-600"
            )} />
          </div>
        )}
        <div className={cn(
          "flex-1 min-w-0 transition-opacity duration-1000",
          fading && "opacity-60"
        )}>
          {children}
        </div>
      </motion.div>
    </ToastPrimitives.Root>
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    asChild
    {...props}
  >
    <motion.button
      className={cn(
        'absolute right-2 top-2 rounded-lg p-1.5 text-gray-400 opacity-0 transition-all duration-200 hover:bg-white/60 hover:text-gray-600 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-300/50 group-hover:opacity-100 backdrop-blur-sm',
        className
      )}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <X className="h-4 w-4" />
    </motion.button>
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn('text-sm font-semibold leading-tight tracking-tight', className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn('text-sm opacity-85 leading-relaxed mt-1', className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}