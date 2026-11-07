import { describe, expect, it } from 'vitest'
import { SHARED_PACKAGE_NAME } from './index'

describe('shared scaffold', () => {
  it('exposes the package name', () => {
    expect(SHARED_PACKAGE_NAME).toBe('@learner-progress/shared')
  })
})
