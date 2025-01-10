import { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'
import { CheckCircleSolidIcon } from '@/components/icons/check-circle-solid'

type MessageGroupProps = { isUseful: boolean; children: ReactNode }

export const MessageGroup = ({ isUseful, children }: MessageGroupProps) => {
  return (
    <div>
      <div
        className={twMerge(
          'px-2 py-2 sm:px-3 sm:py-3 border border-neutral-800 rounded space-y-0.5',
          isUseful && 'border-green-600 border-2',
        )}
      >
        {children}
      </div>
      {isUseful && (
        <div className="flex items-center space-x-1 text-green-400 font-semibold py-1">
          <CheckCircleSolidIcon />
          <span>Useful</span>
        </div>
      )}
    </div>
  )
}
