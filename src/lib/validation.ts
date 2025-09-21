/**
 * Common validation utilities for forms
 */

export interface ValidationErrors {
  [key: string]: string
}

/**
 * Email validation regex pattern
 * Matches most common email formats
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Password validation requirements
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  // At least one uppercase, one lowercase, and one number
  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/
}

/**
 * Validate email address
 */
export const validateEmail = (email: string): string | null => {
  if (!email.trim()) {
    return 'Email is required'
  }

  if (!EMAIL_REGEX.test(email)) {
    return 'Please enter a valid email address'
  }

  return null
}

/**
 * Validate password strength
 */
export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Password is required'
  }

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    return `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`
  }

  if (!PASSWORD_REQUIREMENTS.pattern.test(password)) {
    return 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  }

  return null
}

/**
 * Validate password confirmation
 */
export const validatePasswordConfirmation = (password: string, confirmPassword: string): string | null => {
  if (!confirmPassword) {
    return 'Please confirm your password'
  }

  if (password !== confirmPassword) {
    return 'Passwords do not match'
  }

  return null
}

/**
 * Validate required field
 */
export const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value.trim()) {
    return `${fieldName} is required`
  }

  return null
}

/**
 * Validate name fields (first name, last name)
 */
export const validateName = (name: string, fieldName: string): string | null => {
  if (!name.trim()) {
    return `${fieldName} is required`
  }

  if (name.trim().length < 2) {
    return `${fieldName} must be at least 2 characters long`
  }

  // Only allow letters, spaces, hyphens, and apostrophes
  if (!/^[a-zA-Z\s\-']+$/.test(name.trim())) {
    return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`
  }

  return null
}

/**
 * Comprehensive form validation for signup
 */
export const validateSignupForm = (formData: {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}): ValidationErrors => {
  const errors: ValidationErrors = {}

  const firstNameError = validateName(formData.firstName, 'First name')
  if (firstNameError) errors.firstName = firstNameError

  const lastNameError = validateName(formData.lastName, 'Last name')
  if (lastNameError) errors.lastName = lastNameError

  const emailError = validateEmail(formData.email)
  if (emailError) errors.email = emailError

  const passwordError = validatePassword(formData.password)
  if (passwordError) errors.password = passwordError

  const confirmPasswordError = validatePasswordConfirmation(formData.password, formData.confirmPassword)
  if (confirmPasswordError) errors.confirmPassword = confirmPasswordError

  return errors
}

/**
 * Comprehensive form validation for login
 */
export const validateLoginForm = (formData: {
  email: string
  password: string
}): ValidationErrors => {
  const errors: ValidationErrors = {}

  const emailError = validateEmail(formData.email)
  if (emailError) errors.email = emailError

  if (!formData.password) {
    errors.password = 'Password is required'
  }

  return errors
}

/**
 * Comprehensive form validation for password reset
 */
export const validatePasswordResetForm = (formData: {
  password: string
  confirmPassword: string
}): ValidationErrors => {
  const errors: ValidationErrors = {}

  const passwordError = validatePassword(formData.password)
  if (passwordError) errors.password = passwordError

  const confirmPasswordError = validatePasswordConfirmation(formData.password, formData.confirmPassword)
  if (confirmPasswordError) errors.confirmPassword = confirmPasswordError

  return errors
}

/**
 * Get password strength score (0-4)
 * 0 = Very weak, 1 = Weak, 2 = Fair, 3 = Good, 4 = Strong
 */
export const getPasswordStrength = (password: string): {
  score: number
  label: string
  color: string
} => {
  if (!password) {
    return { score: 0, label: 'Very weak', color: 'red' }
  }

  let score = 0

  // Length check
  if (password.length >= 8) score++
  if (password.length >= 12) score++

  // Character diversity
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z\d]/.test(password)) score++ // Special characters

  // Penalize common patterns
  if (/(.)\1{2,}/.test(password)) score-- // Repeated characters
  if (/123|abc|qwe/i.test(password)) score-- // Sequential patterns

  // Normalize score to 0-4 range
  score = Math.max(0, Math.min(4, score))

  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['red', 'orange', 'yellow', 'blue', 'green']

  return {
    score,
    label: labels[score],
    color: colors[score]
  }
}

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (errors: ValidationErrors): string[] => {
  return Object.values(errors).filter(Boolean)
}

/**
 * Check if form has any validation errors
 */
export const hasValidationErrors = (errors: ValidationErrors): boolean => {
  return Object.values(errors).some(error => Boolean(error))
}