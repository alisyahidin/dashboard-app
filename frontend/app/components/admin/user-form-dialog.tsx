import { useState } from 'react'
import { revalidateLogic } from '@tanstack/react-form'
import { AlertCircleIcon, Loader2Icon } from 'lucide-react'
import { z } from 'zod'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { useAuthErrorHandler } from '~/hooks/use-auth-error'
import { useForm } from '~/hooks/use-form'
import { ApiError } from '~/services/api'
import type { Role } from '~/services/roles'
import { createUser, updateUser, USER_NAME_MAX, USER_NAME_MIN, type AdminUser } from '~/services/users'

const UserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(USER_NAME_MIN, "Enter the person's full name.")
    .max(USER_NAME_MAX, `Name must be ${USER_NAME_MAX} characters or fewer.`),
  email: z.string().trim().email('Enter a valid email address, like name@company.com.'),
  roleId: z.string().min(1, 'Choose a role.'),
})

export function UserFormDialog({
  open,
  user,
  roles,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  user: AdminUser | null
  roles: Role[]
  onOpenChange: (open: boolean) => void
  onSaved: (user: AdminUser, created: boolean) => void
}) {
  const editing = user !== null
  const roleLocked = Boolean(user?.isCurrentUser)
  const handleAuthError = useAuthErrorHandler()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({})
  const defaultRoleId = roles.find((r) => r.name === 'officer')?.id ?? roles[0]?.id ?? ''

  const form = useForm({
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      roleId: user?.role.id ?? defaultRoleId,
    },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: UserSchema },
    onSubmit: async ({ value }) => {
      setSubmitError(null)
      setServerErrors({})
      const body = { name: value.name.trim(), email: value.email.trim(), roleId: value.roleId }
      try {
        if (user) {
          onSaved(await updateUser(user.id, body), false)
        } else {
          const { user: created } = await createUser(body)
          onSaved(created, true)
        }
        form.reset()
      } catch (error) {
        if (handleAuthError(error)) {
          handleOpenChange(false, true)
          return
        }
        if (error instanceof ApiError && error.fieldErrors) {
          setServerErrors(Object.fromEntries(Object.entries(error.fieldErrors).map(([k, v]) => [k, v[0] ?? ''])))
          return
        }
        setSubmitError(
          error instanceof ApiError && error.status === 0
            ? 'The server could not be reached. Your input is kept, so you can try again.'
            : error instanceof ApiError
              ? error.message
              : 'Something went wrong. Your input is kept, so you can try again.',
        )
      }
    },
  })

  function handleOpenChange(next: boolean, force = false) {
    if (!next && form.state.isSubmitting && !force) return
    if (!next) {
      form.reset()
      setSubmitError(null)
      setServerErrors({})
    }
    onOpenChange(next)
  }

  function clearServerError(key: string) {
    if (!serverErrors[key]) return
    setServerErrors(({ [key]: _, ...rest }) => rest)
  }

  const firstName = (user?.name ?? '').split(' ')[0] || 'them'

  return (
    <Dialog open={open} onOpenChange={(next) => handleOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <form
          noValidate
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit user' : 'Add user'}</DialogTitle>
            <DialogDescription>
              {editing
                ? `Changes apply to ${firstName} right away.`
                : 'After saving you get a login link to share. They set their own password when they open it.'}
            </DialogDescription>
          </DialogHeader>

          {submitError && (
            <div role="alert" className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive">
              <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div className="flex flex-col gap-0.5">
                <div className="font-medium">{editing ? 'Changes were not saved' : 'User was not added'}</div>
                <div className="text-sm">{submitError}</div>
              </div>
            </div>
          )}

          <form.Field name="name">
            {(field) => {
              const serverError = serverErrors['name']
              const invalid = !field.state.meta.isValid || Boolean(serverError)
              return (
                <Field data-invalid={invalid}>
                  <FieldLabel htmlFor="user-name">Full name</FieldLabel>
                  <Input
                    id="user-name"
                    name={field.name}
                    autoComplete="off"
                    placeholder="Wahyu Nugroho"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => {
                      field.handleChange(e.target.value)
                      clearServerError('name')
                    }}
                    aria-invalid={invalid}
                  />
                  {serverError ? <FieldError>{serverError}</FieldError> : <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          </form.Field>

          <form.Field name="email">
            {(field) => {
              const serverError = serverErrors['email']
              const invalid = !field.state.meta.isValid || Boolean(serverError)
              return (
                <Field data-invalid={invalid}>
                  <FieldLabel htmlFor="user-email">Email</FieldLabel>
                  <Input
                    id="user-email"
                    name={field.name}
                    type="email"
                    autoComplete="off"
                    placeholder="name@company.com"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => {
                      field.handleChange(e.target.value)
                      clearServerError('email')
                    }}
                    aria-invalid={invalid}
                  />
                  {serverError ? (
                    <FieldError>{serverError}</FieldError>
                  ) : invalid ? (
                    <FieldError errors={field.state.meta.errors} />
                  ) : (
                    <FieldDescription>
                      {editing ? 'They sign in with this address.' : 'Used to sign in. Each user needs their own address.'}
                    </FieldDescription>
                  )}
                </Field>
              )
            }}
          </form.Field>

          <form.Field name="roleId">
            {(field) => {
              const serverError = serverErrors['roleId']
              const invalid = !field.state.meta.isValid || Boolean(serverError)
              return (
                <Field data-invalid={invalid}>
                  <FieldLabel htmlFor="user-role">Role</FieldLabel>
                  <Select
                    items={roles.map((r) => ({ value: r.id, label: r.name }))}
                    value={field.state.value}
                    disabled={roleLocked}
                    onValueChange={(value) => {
                      field.handleChange(String(value ?? ''))
                      clearServerError('roleId')
                    }}
                  >
                    <SelectTrigger id="user-role" className="h-9 w-full" aria-invalid={invalid}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {serverError ? (
                    <FieldError>{serverError}</FieldError>
                  ) : invalid ? (
                    <FieldError errors={field.state.meta.errors} />
                  ) : roleLocked ? (
                    <FieldDescription>You can't change your own role. Ask another admin.</FieldDescription>
                  ) : null}
                </Field>
              )
            }}
          </form.Field>

          <form.Subscribe
            selector={(state) => ({
              isSubmitting: state.isSubmitting,
              pristine:
                editing &&
                state.values.name.trim() === user?.name &&
                state.values.email.trim().toLowerCase() === user?.email.toLowerCase() &&
                state.values.roleId === user?.role.id,
            })}
          >
            {({ isSubmitting, pristine }) => (
              <DialogFooter>
                <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || pristine}>
                  {isSubmitting && <Loader2Icon data-icon="inline-start" className="animate-spin" />}
                  {isSubmitting ? 'Saving…' : editing ? 'Save changes' : 'Add user and get link'}
                </Button>
              </DialogFooter>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  )
}
