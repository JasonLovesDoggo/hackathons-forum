import { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'
import { CheckCircleSolidIcon } from '@/components/icons/check-circle-solid'

type MessageGroupProps = { children: ReactNode }

export const MessageGroup = ({ children }: MessageGroupProps) => {
  return (
    <div>
      <div
        className={twMerge(
          'px-2 py-2 sm:px-3 sm:py-3 border border-neutral-800 rounded space-y-0.5',
        )}
      >
        {children}
      </div>
    </div>
  )
}
