import { ApiError } from './api'
import { me, type User } from './auth'

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { user } = await me()
    return user
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}
