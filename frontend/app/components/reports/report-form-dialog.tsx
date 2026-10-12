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
import { Textarea } from '~/components/ui/textarea'
import { useForm } from '~/hooks/use-form'
import { ApiError } from '~/services/api'
import {
  createReport,
  updateReport,
  REPORT_DESCRIPTION_MAX,
  REPORT_DESCRIPTION_MIN,
  REPORT_NAME_MAX,
  REPORT_NAME_MIN,
  type Report,
} from '~/services/reports'

const ReportSchema = z.object({
  name: z
    .string()
    .trim()
    .min(REPORT_NAME_MIN, `Name must be at least ${REPORT_NAME_MIN} characters.`)
    .max(REPORT_NAME_MAX, `Name must be ${REPORT_NAME_MAX} characters or fewer.`),
  description: z
    .string()
    .trim()
    .min(REPORT_DESCRIPTION_MIN, `Description must be at least ${REPORT_DESCRIPTION_MIN} characters.`)
    .max(REPORT_DESCRIPTION_MAX, `Description must be ${REPORT_DESCRIPTION_MAX} characters or fewer.`),
})

export function ReportFormDialog({
  open,
  report,
  onOpenChange,
  onSaved,
  onStale,
}: {
  open: boolean
  report?: Report | null
  onOpenChange: (open: boolean) => void
  onSaved: (report: Report) => void
  onStale?: (error: ApiError) => void
}) {
  const editing = Boolean(report)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { name: report?.name ?? '', description: report?.description ?? '' },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: ReportSchema },
    onSubmit: async ({ value }) => {
      setSubmitError(null)
      const body = { name: value.name.trim(), description: value.description.trim() }
      if (report && body.name === report.name && body.description === report.description) {
        onOpenChange(false)
        return
      }
      try {
        const saved = report ? await updateReport(report.id, body) : await createReport(body)
        form.reset()
        onSaved(saved)
      } catch (error) {
        if (report && error instanceof ApiError && (error.status === 404 || error.status === 409)) {
          form.reset()
          onStale?.(error)
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

  function handleOpenChange(next: boolean) {
    if (!next && form.state.isSubmitting) return
    if (!next) {
      form.reset()
      setSubmitError(null)
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            <DialogTitle>{editing ? 'Edit report' : 'New report'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Pending reports can be edited until a reviewer decides. The change is added to the status history.'
                : 'The report is saved with Pending status until a reviewer decides.'}
            </DialogDescription>
          </DialogHeader>

          {submitError && (
            <div role="alert" className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive">
              <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div className="flex flex-col gap-0.5">
                <div className="font-medium">{editing ? 'Changes were not saved' : 'Report was not created'}</div>
                <div className="text-sm">{submitError}</div>
              </div>
            </div>
          )}

          <form.Field name="name">
            {(field) => {
              const invalid = !field.state.meta.isValid
              return (
                <Field data-invalid={invalid}>
                  <FieldLabel htmlFor="report-name">Name</FieldLabel>
                  <Input
                    id="report-name"
                    name={field.name}
                    placeholder="Borehole BH-08 soil investigation"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={invalid}
                    maxLength={REPORT_NAME_MAX + 50}
                  />
                  {invalid ? (
                    <FieldError errors={field.state.meta.errors} />
                  ) : (
                    <FieldDescription>{REPORT_NAME_MIN} to {REPORT_NAME_MAX} characters.</FieldDescription>
                  )}
                </Field>
              )
            }}
          </form.Field>

          <form.Field name="description">
            {(field) => {
              const invalid = !field.state.meta.isValid
              const length = field.state.value.trim().length
              return (
                <Field data-invalid={invalid}>
                  <FieldLabel htmlFor="report-description">Description</FieldLabel>
                  <Textarea
                    id="report-description"
                    name={field.name}
                    rows={4}
                    className="min-h-26 resize-none"
                    placeholder="What was inspected, what was found, and where."
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={invalid}
                  />
                  <div className="flex justify-between gap-3 text-sm">
                    {invalid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : (
                      <FieldDescription>{REPORT_DESCRIPTION_MIN} to {REPORT_DESCRIPTION_MAX} characters.</FieldDescription>
                    )}
                    <span
                      className={`shrink-0 tabular-nums ${length > REPORT_DESCRIPTION_MAX ? 'text-destructive' : 'text-muted-foreground'}`}
                      aria-live="polite"
                    >
                      {length} / {REPORT_DESCRIPTION_MAX}
                    </span>
                  </div>
                </Field>
              )
            }}
          </form.Field>

          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <DialogFooter>
                <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2Icon data-icon="inline-start" className="animate-spin" />}
                  {isSubmitting
                    ? editing ? 'Saving…' : 'Creating…'
                    : submitError ? 'Try again' : editing ? 'Save changes' : 'Create report'}
                </Button>
              </DialogFooter>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  )
}
