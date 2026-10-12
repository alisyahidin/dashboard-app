import { useState } from 'react'
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
import { REPORT_NOTE_MAX, REPORT_NOTE_MIN, type Report } from '~/services/reports'

export function RejectReportDialog({
  report,
  onCancel,
  onConfirm,
}: {
  report: Report | null
  onCancel: () => void
  onConfirm: (report: Report, reason: string) => void
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  function close() {
    setReason('')
    setError(null)
    onCancel()
  }

  function confirm() {
    if (!report) return
    const trimmed = reason.trim()
    if (trimmed.length < REPORT_NOTE_MIN) {
      setError(`Add a reason of at least ${REPORT_NOTE_MIN} characters.`)
      return
    }
    setReason('')
    setError(null)
    onConfirm(report, trimmed)
  }

  return (
    <AlertDialog open={report !== null} onOpenChange={(open) => { if (!open) close() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reject this report?</AlertDialogTitle>
          <AlertDialogDescription>
            “{report?.name}” will be marked Rejected. The reason is saved in the report's status history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="reject-reason">Reason</FieldLabel>
          <Textarea
            id="reject-reason"
            rows={3}
            className="min-h-20 resize-none"
            placeholder="What is missing or wrong in this report?"
            value={reason}
            maxLength={REPORT_NOTE_MAX}
            aria-invalid={Boolean(error)}
            onChange={(e) => {
              setReason(e.target.value)
              setError(null)
            }}
          />
          {error ? <FieldError>{error}</FieldError> : <FieldDescription>Required, at least {REPORT_NOTE_MIN} characters.</FieldDescription>}
        </Field>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button className="bg-destructive text-white hover:bg-destructive/90" onClick={confirm}>
            Reject report
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
