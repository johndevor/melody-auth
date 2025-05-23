import {
  useCallback, useMemo, useState,
} from 'hono/jsx'
import {
  object, string,
} from 'yup'
import {
  routeConfig, typeConfig,
} from 'configs'
import {
  validate, emailField, passwordField,
  confirmPasswordField,
} from 'pages/tools/form'
import {
  InitialProps, View,
} from 'pages/hooks'
import {
  handleAuthorizeStep, parseAuthorizeBaseValues,
  parseResponse,
} from 'pages/tools/request'
import { AuthorizeParams } from 'pages/tools/param'
import { validateError } from 'pages/tools/locale'

export interface UseSignUpFormProps {
  locale: typeConfig.Locale;
  initialProps: InitialProps;
  params: AuthorizeParams;
  onSubmitError: (error: string | null) => void;
  onSwitchView: (view: View) => void;
}

const useSignUpForm = ({
  locale,
  initialProps,
  params,
  onSubmitError,
  onSwitchView,
}: UseSignUpFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  const [touched, setTouched] = useState({
    email: false,
    password: false,
    confirmPassword: false,
    firstName: false,
    lastName: false,
  })

  const values = useMemo(
    () => ({
      email,
      password,
      confirmPassword,
      firstName,
      lastName,
    }),
    [email, password, confirmPassword, firstName, lastName],
  )

  const signUpSchema = object({
    email: emailField(locale),
    password: passwordField(locale),
    confirmPassword: confirmPasswordField(locale),
    firstName: initialProps.namesIsRequired
      ? string().required(validateError.firstNameIsEmpty[locale])
      : string(),
    lastName: initialProps.namesIsRequired
      ? string().required(validateError.lastNameIsEmpty[locale])
      : string(),
  })

  const errors = validate(
    signUpSchema,
    values,
  )

  const handleChange = (
    name: 'email' | 'password' | 'confirmPassword' | 'firstName' | 'lastName', value: string,
  ) => {
    onSubmitError(null)
    switch (name) {
    case 'email':
      setEmail(value)
      break
    case 'password':
      setPassword(value)
      break
    case 'confirmPassword':
      setConfirmPassword(value)
      break
    case 'firstName':
      setFirstName(value)
      break
    case 'lastName':
      setLastName(value)
      break
    }
  }

  const handleSubmit = useCallback(
    (e: Event) => {
      e.preventDefault()
      setTouched({
        email: true,
        password: true,
        confirmPassword: true,
        firstName: true,
        lastName: true,
      })

      if (Object.values(errors).some((error) => error !== undefined)) {
        return
      }

      setIsSubmitting(true)

      fetch(
        routeConfig.IdentityRoute.AuthorizeAccount,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: initialProps.enableNames ? firstName : undefined,
            lastName: initialProps.enableNames ? lastName : undefined,
            email,
            password,
            ...parseAuthorizeBaseValues(
              params,
              locale,
            ),
          }),
        },
      )
        .then(parseResponse)
        .then((response) => {
          handleAuthorizeStep(
            response,
            locale,
            onSwitchView,
          )
        })
        .catch((error) => {
          onSubmitError(error)
        })
        .finally(() => {
          setIsSubmitting(false)
        })
    },
    [params, locale, onSubmitError, initialProps, onSwitchView, email, password, firstName, lastName, errors],
  )

  return {
    values,
    errors: {
      email: touched.email ? errors.email : undefined,
      password: touched.password ? errors.password : undefined,
      confirmPassword: touched.confirmPassword ? errors.confirmPassword : undefined,
      firstName: touched.firstName ? errors.firstName : undefined,
      lastName: touched.lastName ? errors.lastName : undefined,
    },
    handleChange,
    handleSubmit,
    isSubmitting,
  }
}

export default useSignUpForm
