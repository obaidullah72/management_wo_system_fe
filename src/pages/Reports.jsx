import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Download, FileText } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import ScrollReveal from '../components/ui/ScrollReveal'
import ErrorMessage from '../components/ui/ErrorMessage'
import { FormField, TextInput } from '../components/ui/FormField'
import {
  getDailyProductionReport,
  getInventoryStatusReport,
  getCompletedWorkOrdersReport,
  getProductionActivityReport,
} from '../api/reports'
import { getErrorMessage } from '../api/client'
import { REPORT_DEFINITIONS } from '../constants'
import { formatDateTime, todayDateInput } from '../utils/format'

const reportFetchers = {
  dailyProduction: getDailyProductionReport,
  inventoryStatus: getInventoryStatusReport,
  completedWorkOrders: getCompletedWorkOrdersReport,
  productionActivity: getProductionActivityReport,
}

function buildDefaultParams(report) {
  const params = {}
  for (const field of report.dateFields ?? []) {
    if (field.defaultToday) {
      params[field.key] = todayDateInput()
    } else {
      params[field.key] = ''
    }
  }
  return params
}

function buildInitialParams() {
  return Object.fromEntries(
    REPORT_DEFINITIONS.map((report) => [report.id, buildDefaultParams(report)])
  )
}

export default function Reports() {
  const [results, setResults] = useState({})
  const [errors, setErrors] = useState({})
  const [params, setParams] = useState(buildInitialParams)

  const generateMutation = useMutation({
    mutationFn: async ({ id, fetcherKey, queryParams }) => {
      const fetcher = reportFetchers[fetcherKey]
      if (!fetcher) throw new Error('Unknown report type')

      const cleaned = Object.fromEntries(
        Object.entries(queryParams).filter(([, value]) => value)
      )
      const data = await fetcher(cleaned)
      return { id, data }
    },
    onSuccess: ({ id, data }) => {
      setResults((prev) => ({
        ...prev,
        [id]: { data, generatedAt: new Date().toISOString() },
      }))
      setErrors((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    },
    onError: (error, { id }) => {
      setErrors((prev) => ({ ...prev, [id]: getErrorMessage(error) }))
    },
  })

  const handleParamChange = (reportId, key, value) => {
    setParams((prev) => ({
      ...prev,
      [reportId]: { ...prev[reportId], [key]: value },
    }))
  }

  const handleGenerate = (report) => {
    generateMutation.mutate({
      id: report.id,
      fetcherKey: report.fetcher,
      queryParams: params[report.id] ?? {},
    })
  }

  const handleDownload = (reportId) => {
    const result = results[reportId]
    if (!result) return

    const blob = new Blob([JSON.stringify(result.data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${reportId}-report.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const reportCards = useMemo(() => REPORT_DEFINITIONS, [])

  return (
    <div>
      <PageHeader
        title="Reporting"
        description="Generate operational reports for analysis and decision-making"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {reportCards.map((report, index) => {
          const result = results[report.id]
          const error = errors[report.id]
          const reportParams = params[report.id] ?? {}
          const isGenerating =
            generateMutation.isPending && generateMutation.variables?.id === report.id

          return (
            <ScrollReveal key={report.id} delay={index * 100}>
              <div className="group hover-lift flex cursor-default flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-slate-100 p-3 transition-all duration-300 group-hover:scale-110 group-hover:bg-slate-800">
                    <FileText className="h-6 w-6 text-slate-600 transition-colors duration-300 group-hover:text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{report.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{report.description}</p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                      <span>
                        Last generated:{' '}
                        {result ? formatDateTime(result.generatedAt) : 'Not yet generated'}
                      </span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                        {report.format}
                      </span>
                    </div>
                    {error && <ErrorMessage message={error} className="mt-3" />}
                  </div>
                </div>

                {(report.dateFields?.length ?? 0) > 0 && (
                  <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                    {report.dateFields.map((field) => (
                      <FormField key={field.key} label={field.label} htmlFor={`${report.id}-${field.key}`}>
                        <TextInput
                          id={`${report.id}-${field.key}`}
                          type={field.type}
                          value={reportParams[field.key] ?? ''}
                          onChange={(e) =>
                            handleParamChange(report.id, field.key, e.target.value)
                          }
                        />
                      </FormField>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                  <Button size="sm" onClick={() => handleGenerate(report)} disabled={isGenerating}>
                    <Download className="h-3.5 w-3.5" />
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!result}
                    onClick={() => handleDownload(report.id)}
                  >
                    Download JSON
                  </Button>
                </div>
              </div>
            </ScrollReveal>
          )
        })}
      </div>
    </div>
  )
}
