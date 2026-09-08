import test from 'node:test'
import assert from 'node:assert/strict'
import { isAllowedEmail, isAllowedGoogleProfile, isAuthConfigured } from '../features/website-lab/auth/access'

test('allowlist requires exact addresses and fails closed', () => {
  assert.equal(isAllowedEmail('guest@example.com', ''), false)
  assert.equal(isAllowedEmail(undefined, 'guest@example.com'), false)
  assert.equal(isAllowedEmail('PERSON@example.com', ' person@example.com, partner@example.com '), true)
  assert.equal(isAllowedEmail('person@example.com.attacker.com', 'person@example.com'), false)
})

test('Google identity must be verified and invited', () => {
  const previous = process.env.WEBSITE_LAB_ALLOWED_EMAILS
  process.env.WEBSITE_LAB_ALLOWED_EMAILS = 'person@example.com'
  try {
    assert.equal(isAllowedGoogleProfile('google', { email: 'person@example.com', email_verified: true }), true)
    for (const profile of [null, {}, { email: 'person@example.com' }, { email: 'person@example.com', email_verified: 'true' }, { email: 'guest@example.com', email_verified: true }]) {
      assert.equal(isAllowedGoogleProfile('google', profile), false)
    }
    assert.equal(isAllowedGoogleProfile('other', { email: 'person@example.com', email_verified: true }), false)
    process.env.WEBSITE_LAB_ALLOWED_EMAILS = ''
    assert.equal(isAuthConfigured(), false)
    assert.equal(isAllowedGoogleProfile('google', { email: 'person@example.com', email_verified: true }), false)
  } finally {
    if (previous === undefined) delete process.env.WEBSITE_LAB_ALLOWED_EMAILS
    else process.env.WEBSITE_LAB_ALLOWED_EMAILS = previous
  }
})
