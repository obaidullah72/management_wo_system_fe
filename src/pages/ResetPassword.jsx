import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Factory, Lock } from 'lucide-react'
import { resetPassword } from '../api/auth'
import { getErrorMessage } from '../api/client'
import Button from '../components/ui/Button'
import ErrorMessage from '../components/ui/ErrorMessage'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { FormField, TextInput } from '../components/ui/FormField'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const [token, setToken] = useState(searchParams.get('token') ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsSubmitting(true)
    try {
      await resetPassword({ token: token.trim(), new_password: newPassword })
      setSuccess(true)
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
          <h1 className="text-2xl font-bold text-white">Set New Password</h1>
          <p className="mt-2 text-sm text-slate-400">Enter your reset token and choose a new password</p>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-8 shadow-xl">
          {success ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-emerald-400">
                Your password has been reset. You can now sign in with your new password.
              </p>
              <Link to="/login">
                <Button className="w-full justify-center">Go to Sign In</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <ErrorMessage message={error} className="mb-4" />

              <div className="space-y-4">
                <FormField label="Reset token" htmlFor="token">
                  <TextInput
                    id="token"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="bg-slate-900 border-slate-600 text-white font-mono text-xs"
                    placeholder="Paste reset token"
                  />
                </FormField>

                <FormField label="New password" htmlFor="new-password">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <TextInput
                      id="new-password"
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 bg-slate-900 border-slate-600 text-white"
                    />
                  </div>
                </FormField>

                <FormField label="Confirm password" htmlFor="confirm-password">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <TextInput
                      id="confirm-password"
                      type="password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 bg-slate-900 border-slate-600 text-white"
                    />
                  </div>
                </FormField>
              </div>

              <Button type="submit" className="mt-6 w-full justify-center" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoadingSpinner className="border-white/30 border-t-white" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
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
