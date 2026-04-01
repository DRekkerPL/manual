import { useState, useEffect, useCallback } from 'react'
import Papa from 'papaparse'
import CountryOverview from './pages/CountryOverview'

const AVAILABLE_COUNTRIES = ['DK']

function parseCsv(text) {
  const { data } = Papa.parse(text, { header: true, dynamicTyping: true, skipEmptyLines: true })
  return data
}

function App() {
  const [country, setCountry] = useState('DK')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadCountryData = useCallback(async (cc) => {
    setLoading(true)
    setError(null)
    try {
      const [baselineText, categoriesText] = await Promise.all([
        fetch(`/analysis/${cc}/baseline_metrics.csv`).then(r => {
          if (!r.ok) throw new Error(`Failed to load baseline_metrics.csv`)
          return r.text()
        }),
        fetch(`/analysis/${cc}/category_breakdown.csv`).then(r => {
          if (!r.ok) throw new Error(`Failed to load category_breakdown.csv`)
          return r.text()
        }),
      ])
      setData({
        baseline: parseCsv(baselineText),
        categories: parseCsv(categoriesText),
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCountryData(country)
  }, [country, loadCountryData])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-[#1B3A6B] text-white px-6 py-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Manual Price Override Analysis</h1>
            <p className="text-blue-200 text-sm">EET Group</p>
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="country-select" className="text-sm text-blue-200">Country</label>
            <select
              id="country-select"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="bg-white text-slate-800 rounded-md px-3 py-1.5 text-sm font-medium shadow-sm cursor-pointer"
            >
              {AVAILABLE_COUNTRIES.map(cc => (
                <option key={cc} value={cc}>{cc}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-slate-400 text-lg">Loading data...</div>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}
        {!loading && !error && data && (
          <CountryOverview data={data} country={country} />
        )}
      </main>
    </div>
  )
}

export default App
