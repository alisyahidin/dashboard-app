import { createFormHook, createFormHookContexts } from '@tanstack/react-form'
import { Button } from '~/components/ui/button'
import { Field } from '~/components/ui/field'
import { Input } from '~/components/ui/input'

const { fieldContext, formContext } = createFormHookContexts()

const { useAppForm: useForm } = createFormHook({
  fieldComponents: {
    Field,
    Input,
  },
  formComponents: {
    Button,
  },
  fieldContext,
  formContext,
})

export {
  useForm
}