import { Download, FileText } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import ScrollReveal from '../components/ui/ScrollReveal'
import { reports } from '../data/mockData'

export default function Reports() {
  return (
    <div>
      <PageHeader
        title="Reporting"
        description="Generate operational reports for analysis and decision-making"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {reports.map((report, index) => (
          <ScrollReveal key={report.id} delay={index * 100}>
            <div className="group hover-lift flex cursor-default flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-slate-100 p-3 transition-all duration-300 group-hover:scale-110 group-hover:bg-slate-800">
                  <FileText className="h-6 w-6 text-slate-600 transition-colors duration-300 group-hover:text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 transition-colors group-hover:text-slate-700">
                    {report.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">{report.description}</p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                    <span>Last generated: {report.lastGenerated}</span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-600 transition-colors group-hover:bg-slate-200">
                      {report.format}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                <Button size="sm">
                  <Download className="h-3.5 w-3.5" />
                  Generate
                </Button>
                <Button size="sm" variant="secondary">
                  View History
                </Button>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  )
}
