import { useCallback } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { getReport, getReportCounts, listReports, type ListReportsParams } from '~/services/reports'

const REPORTS_KEY = 'reports'

export function useReports(params: ListReportsParams) {
  return useSWR([REPORTS_KEY, 'list', params], ([, , p]) => listReports(p), {
    keepPreviousData: true,
  })
}

export function useReportCounts() {
  return useSWR([REPORTS_KEY, 'counts'], () => getReportCounts())
}

export function useReport(id: string | null) {
  return useSWR(id === null ? null : [REPORTS_KEY, 'detail', id], ([, , reportId]) => getReport(reportId))
}

export function useRevalidateReports() {
  const { mutate } = useSWRConfig()
  return useCallback(
    () => mutate((key) => Array.isArray(key) && key[0] === REPORTS_KEY),
    [mutate],
  )
}
