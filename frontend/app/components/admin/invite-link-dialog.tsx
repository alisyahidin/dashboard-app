import { useState } from 'react'
import { CheckIcon, CopyIcon, InfinityIcon, KeyRoundIcon, ShieldAlertIcon } from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Field, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import type { AdminUser } from '~/services/users'

export function InviteLinkDialog({
  user,
  fromAdd,
  onClose,
}: {
  user: AdminUser | null
  fromAdd: boolean
  onClose: () => void
}) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const firstName = user?.name.split(' ')[0] ?? ''
  const url = user?.invite?.url ?? ''

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  function handleOpenChange(open: boolean) {
    if (open) return
    setCopyState('idle')
    onClose()
  }

  return (
    <Dialog open={Boolean(user?.invite)} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          {fromAdd && (
            <div className="mb-1 flex size-9 items-center justify-center rounded-full bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300">
              <CheckIcon className="size-4" strokeWidth={2.5} aria-hidden="true" />
            </div>
          )}
          <DialogTitle>{fromAdd ? 'Share the login link' : `Login link for ${user?.name ?? ''}`}</DialogTitle>
          <DialogDescription>
            {fromAdd
              ? `${user?.name} was added as ${user?.role.name}. Send them this link so they can set a password and sign in.`
              : `Waiting for ${firstName} to set a password. Send this link again if they lost it.`}
          </DialogDescription>
        </DialogHeader>

        <Field>
          <FieldLabel htmlFor="invite-link">Login link</FieldLabel>
          <div className="flex gap-2">
            <Input
              id="invite-link"
              readOnly
              value={url}
              className="min-w-0 flex-1 bg-muted/50 font-mono text-xs"
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button type="button" onClick={copy}>
              {copyState === 'copied' ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
              {copyState === 'copied' ? 'Copied' : 'Copy'}
            </Button>
          </div>
          {copyState === 'failed' && (
            <p role="alert" className="text-sm text-destructive">Couldn't copy automatically. Select the link and copy it.</p>
          )}
        </Field>

        <ul className="flex flex-col gap-2 rounded-lg border bg-muted/40 px-3.5 py-3 text-sm text-foreground/80">
          <li className="flex items-start gap-2">
            <InfinityIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span>Doesn't expire. It stays valid until {firstName} sets a password.</span>
          </li>
          <li className="flex items-start gap-2">
            <KeyRoundIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span>Works once. {firstName} opens it, sets a password and is signed in.</span>
          </li>
          <li className="flex items-start gap-2">
            <ShieldAlertIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span>Share it only with {firstName}. Anyone with the link can claim the account.</span>
          </li>
        </ul>

        <DialogFooter className="items-center sm:justify-end">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
