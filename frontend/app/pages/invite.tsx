import { useState } from 'react'
import { Link } from 'react-router'
import useSWR from 'swr'
import {
  AlertCircleIcon,
  Building2Icon,
  CheckIcon,
  CircleCheckIcon,
  CircleIcon,
  EyeIcon,
  EyeOffIcon,
  LinkIcon,
  Loader2Icon,
  LockIcon,
  type LucideIcon,
} from 'lucide-react'
import { cn } from 'cn'
import { Button, buttonVariants } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Field, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Skeleton } from '~/components/ui/skeleton'
import { useForm } from '~/hooks/use-form'
import { ApiError } from '~/services/api'
import { acceptInvite, getInvite, passwordRules } from '~/services/users'

function checkRules(password: string, confirm: string) {
  return [
    ...passwordRules.map((rule) => ({ key: rule.key, label: rule.label, ok: rule.test(password) })),
    { key: 'match', label: 'Both passwords match', ok: password.length > 0 && password === confirm },
  ]
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Building2Icon className="size-4" aria-hidden="true" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-semibold">Dashboard App</span>
        <span className="text-xs text-muted-foreground">Field Report Dashboard</span>
      </div>
    </div>
  )
}

function Notice({
  icon: Icon,
  title,
  children,
  action,
  tone = 'neutral',
}: {
  icon: LucideIcon
  title: string
  children: React.ReactNode
  action?: React.ReactNode
  tone?: 'neutral' | 'success'
}) {
  return (
    <section aria-labelledby="invite-notice-title" className="flex flex-col items-center gap-2.5 text-center">
      <div
        className={cn(
          'flex size-11 items-center justify-center rounded-full',
          tone === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300' : 'bg-muted text-muted-foreground',
        )}
      >
        <Icon className="size-5" strokeWidth={tone === 'success' ? 2.5 : 2} aria-hidden="true" />
      </div>
      <h1 id="invite-notice-title" className="text-xl font-semibold">{title}</h1>
      <div className="text-sm text-muted-foreground">{children}</div>
      {action && <div className="mt-2">{action}</div>}
    </section>
  )
}

export function PageInvite({ token }: { token: string }) {
  const invite = useSWR(['invite', token], ([, t]) => getInvite(t), { shouldRetryOnError: false, revalidateOnFocus: false })
  const [show, setShow] = useState(false)
  const [done, setDone] = useState<{ email: string; role: string } | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { password: '', confirm: '' },
    onSubmit: async ({ value }) => {
      setSubmitError(null)
      if (!checkRules(value.password, value.confirm).every((r) => r.ok)) return
      try {
        setDone(await acceptInvite(token, value.password))
      } catch (error) {
        if (error instanceof ApiError && (error.status === 404 || error.status === 410)) {
          await invite.mutate()
          return
        }
        setSubmitError(
          error instanceof ApiError && error.status === 0
            ? 'The server could not be reached. Try again.'
            : error instanceof ApiError
              ? error.message
              : 'Something went wrong. Try again.',
        )
      }
    },
  })

  const data = invite.data
  const notFound = invite.error instanceof ApiError && invite.error.status === 404

  let content: React.ReactNode
  if (done) {
    content = (
      <Notice
        icon={CheckIcon}
        tone="success"
        title="You're all set"
        action={<Link to="/login" className={buttonVariants({ size: 'lg' })}>Go to sign in</Link>}
      >
        Your password is saved and your account is ready as {done.role}. Sign in with {done.email} to get started.
      </Notice>
    )
  } else if (invite.isLoading) {
    content = (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  } else if (notFound) {
    content = (
      <Notice icon={LinkIcon} title="This link isn't valid" action={<Link to="/login" className={buttonVariants({ variant: 'outline' })}>Go to sign in</Link>}>
        Check that you copied the whole link, or ask your admin to send a new one.
      </Notice>
    )
  } else if (invite.error || !data) {
    content = (
      <Notice icon={AlertCircleIcon} title="We couldn't open this link" action={<Button variant="outline" onClick={() => invite.mutate()}>Try again</Button>}>
        The server did not respond. Check your connection, then try again.
      </Notice>
    )
  } else if (data.state === 'used') {
    content = (
      <Notice icon={LockIcon} title="This link was already used" action={<Link to="/login" className={buttonVariants({ size: 'lg' })}>Go to sign in</Link>}>
        A password has already been set for this account. Sign in with your email and password instead.
      </Notice>
    )
  } else {
    const firstName = data.name.split(' ')[0]
    content = (
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[22px] leading-7 font-semibold tracking-tight">Set up your account</h1>
          <p className="text-sm text-muted-foreground">
            Hi {firstName}, {data.invitedBy} added you to the Field Report Dashboard. Choose a password to finish.
          </p>
        </div>

        <dl className="grid grid-cols-[4rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 rounded-lg border bg-muted/40 px-3.5 py-3 text-sm">
          <dt className="text-muted-foreground">Email</dt>
          <dd className="font-medium break-all">{data.email}</dd>
          <dt className="text-muted-foreground">Role</dt>
          <dd className="font-medium">{data.role}</dd>
        </dl>

        {submitError && (
          <div role="alert" className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {submitError}
          </div>
        )}

        <form.Field name="password">
          {(field) => (
            <Field>
              <FieldLabel htmlFor="new-password">Password</FieldLabel>
              <div className="relative">
                <Input
                  id="new-password"
                  name={field.name}
                  type={show ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="h-10 pr-11"
                  aria-describedby="password-rules"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1"
                  aria-label={show ? 'Hide password' : 'Show password'}
                  onClick={() => setShow((s) => !s)}
                >
                  {show ? <EyeOffIcon /> : <EyeIcon />}
                </Button>
              </div>
            </Field>
          )}
        </form.Field>

        <form.Field name="confirm">
          {(field) => (
            <Field>
              <FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
              <Input
                id="confirm-password"
                name={field.name}
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                className="h-10"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </Field>
          )}
        </form.Field>

        <form.Subscribe selector={(state) => ({ values: state.values, isSubmitting: state.isSubmitting })}>
          {({ values, isSubmitting }) => {
            const rules = checkRules(values.password, values.confirm)
            const ready = rules.every((r) => r.ok)
            return (
              <>
                <ul id="password-rules" aria-live="polite" className="flex flex-col gap-1.5 text-sm">
                  {rules.map((rule) => (
                    <li key={rule.key} className={cn('flex items-center gap-2', rule.ok ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground')}>
                      {rule.ok ? <CircleCheckIcon className="size-3.5" aria-hidden="true" /> : <CircleIcon className="size-3.5" aria-hidden="true" />}
                      <span>{rule.label}</span>
                      <span className="sr-only">{rule.ok ? '(done)' : '(not yet)'}</span>
                    </li>
                  ))}
                </ul>
                <Button type="submit" size="lg" className="h-11" disabled={!ready || isSubmitting}>
                  {isSubmitting && <Loader2Icon data-icon="inline-start" className="animate-spin" />}
                  {isSubmitting ? 'Setting up your account…' : 'Set password and sign in'}
                </Button>
              </>
            )
          }}
        </form.Subscribe>

        <p className="text-center text-xs text-muted-foreground">
          This link works once. After you set a password, sign in with your email.
        </p>
      </form>
    )
  }

  return (
    <div className="flex min-h-svh flex-col items-center gap-6 bg-muted px-4 py-16">
      <Brand />
      <Card className="w-full max-w-[420px] p-7">{content}</Card>
    </div>
  )
}
