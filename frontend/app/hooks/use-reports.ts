import { useCallback } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { getReport, getReportSummary, listReports, type ListReportsParams } from '~/services/reports'

const REPORTS_KEY = 'reports'

export function useReports(params: ListReportsParams) {
  return useSWR([REPORTS_KEY, 'list', params], ([, , p]) => listReports(p), {
    keepPreviousData: true,
  })
}

export function useReportSummary() {
  return useSWR([REPORTS_KEY, 'summary'], () => getReportSummary())
}

export function useReport(id: number | null) {
  return useSWR(id === null ? null : [REPORTS_KEY, 'detail', id], ([, , reportId]) => getReport(reportId))
}

export function useRevalidateReports() {
  const { mutate } = useSWRConfig()
  return useCallback(
    () => mutate((key) => Array.isArray(key) && key[0] === REPORTS_KEY),
    [mutate],
  )
}
