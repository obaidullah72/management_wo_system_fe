import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Factory, Mail } from 'lucide-react'
import { forgotPassword } from '../api/auth'
import { getErrorMessage } from '../api/client'
import Button from '../components/ui/Button'
import ErrorMessage from '../components/ui/ErrorMessage'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { FormField, TextInput } from '../components/ui/FormField'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const data = await forgotPassword(email.trim())
      setResult(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-700">
            <Factory className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="mt-2 text-sm text-slate-400">
            Enter your account email to receive a reset token
          </p>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-8 shadow-xl">
          {result ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-300">{result.message}</p>
              {result.reset_token && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-amber-400">
                    Development mode — reset token
                  </p>
                  <p className="break-all font-mono text-xs text-amber-100">{result.reset_token}</p>
                  <Link
                    to={`/reset-password?token=${encodeURIComponent(result.reset_token)}`}
                    className="mt-3 inline-block text-sm font-medium text-amber-300 hover:text-amber-200"
                  >
                    Continue to reset password →
                  </Link>
                </div>
              )}
              {!result.reset_token && (
                <p className="text-xs text-slate-500">
                  If your email is registered, check your inbox for reset instructions.
                </p>
              )}
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <ErrorMessage message={error} className="mb-4" />

              <FormField label="Email address" htmlFor="email">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <TextInput
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-slate-900 border-slate-600 text-white"
                    placeholder="you@factory.com"
                  />
                </div>
              </FormField>

              <Button type="submit" className="mt-6 w-full justify-center" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoadingSpinner className="border-white/30 border-t-white" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Token'
                )}
              </Button>

              <Link
                to="/login"
                className="mt-4 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
