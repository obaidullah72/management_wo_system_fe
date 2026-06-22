import { useState } from 'react'
import { changePassword } from '../../api/auth'
import { getErrorMessage } from '../../api/client'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import ErrorMessage from '../ui/ErrorMessage'
import { FormField, TextInput } from '../ui/FormField'

export default function ChangePasswordModal({ open, onClose }) {
  const [form, setForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleClose = () => {
    setForm({ current_password: '', new_password: '', confirm_password: '' })
    setError('')
    setSuccess('')
    onClose()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (form.new_password !== form.confirm_password) {
      setError('New passwords do not match')
      return
    }

    if (form.new_password.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }

    setIsSubmitting(true)
    try {
      await changePassword({
        current_password: form.current_password,
        new_password: form.new_password,
      })
      setSuccess('Password changed successfully')
      setForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Change Password"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            {success ? 'Close' : 'Cancel'}
          </Button>
          {!success && (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </Button>
          )}
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorMessage message={error} />}
        {success && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>
        )}
        {!success && (
          <>
            <FormField label="Current Password" htmlFor="current-pw">
              <TextInput
                id="current-pw"
                type="password"
                required
                value={form.current_password}
                onChange={(e) => setForm({ ...form, current_password: e.target.value })}
              />
            </FormField>
            <FormField label="New Password" htmlFor="new-pw">
              <TextInput
                id="new-pw"
                type="password"
                required
                minLength={8}
                value={form.new_password}
                onChange={(e) => setForm({ ...form, new_password: e.target.value })}
              />
            </FormField>
            <FormField label="Confirm New Password" htmlFor="confirm-pw">
              <TextInput
                id="confirm-pw"
                type="password"
                required
                value={form.confirm_password}
                onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
              />
            </FormField>
          </>
        )}
      </form>
    </Modal>
  )
}
