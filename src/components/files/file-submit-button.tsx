'use client'

import { useFormStatus } from 'react-dom'
import { Loader } from 'lucide-react'

type Props = {
  idleText: string
  loadingText?: string
  className?: string
}

export default function FileSubmitButton({
  idleText,
  loadingText = 'Bezig met uploaden...',
  className = 'btn-primary inline-flex items-center justify-center px-4 py-2 text-sm font-semibold',
}: Props) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-70`}
    >
      {pending ? (
        <>
          <Loader className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        idleText
      )}
    </button>
  )
}