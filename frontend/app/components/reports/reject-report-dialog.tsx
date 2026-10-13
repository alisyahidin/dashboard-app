import { z } from 'zod'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { Button } from '~/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '~/components/ui/field'
import { Textarea } from '~/components/ui/textarea'
import { useForm } from '~/hooks/use-form'
import { REPORT_NOTE_MAX, REPORT_NOTE_MIN, type Report } from '~/services/reports'

const RejectReportSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(REPORT_NOTE_MIN, `Add a reason of at least ${REPORT_NOTE_MIN} characters.`)
    .max(REPORT_NOTE_MAX, `Reason must be ${REPORT_NOTE_MAX} characters or fewer.`),
})

export function RejectReportDialog({
  report,
  onCancel,
  onConfirm,
}: {
  report: Report | null
  onCancel: () => void
  onConfirm: (report: Report, reason: string) => void
}) {
  const form = useForm({
    defaultValues: {
      reason: '',
    },
    validators: {
      onChange: RejectReportSchema,
    },
    onSubmit: ({ value }) => {
      if (!report) return
      form.reset()
      onConfirm(report, value.reason.trim())
    },
  })

  function close() {
    form.reset()
    onCancel()
  }

  return (
    <AlertDialog open={report !== null} onOpenChange={(open) => { if (!open) close() }}>
      <AlertDialogContent>
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this report?</AlertDialogTitle>
            <AlertDialogDescription>
              “{report?.name}” will be marked Rejected. The reason is saved in the report's status history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form.Field name="reason">
            {(field) => {
              const invalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={invalid}>
                  <FieldLabel htmlFor="reject-reason">Reason</FieldLabel>
                  <Textarea
                    id="reject-reason"
                    name={field.name}
                    rows={3}
                    className="min-h-20 resize-none"
                    placeholder="What is missing or wrong in this report?"
                    value={field.state.value}
                    maxLength={REPORT_NOTE_MAX}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={invalid}
                  />
                  {invalid ? (
                    <FieldError errors={field.state.meta.errors} />
                  ) : (
                    <FieldDescription>Required, at least {REPORT_NOTE_MIN} characters.</FieldDescription>
                  )}
                </Field>
              )
            }}
          </form.Field>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <Button type="submit" className="bg-destructive text-white hover:bg-destructive/90">
              Reject report
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
