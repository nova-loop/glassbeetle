import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import {
  MAX_CREDENTIAL_VALUE_LENGTH,
  SetCredentialDto,
} from './set-credential.dto.js';

const VALIDATION_OPTIONS = {
  whitelist: true,
  forbidNonWhitelisted: true,
};

async function validateDto(payload: Record<string, unknown>) {
  const instance = plainToInstance(SetCredentialDto, payload);
  return validate(instance, VALIDATION_OPTIONS);
}

describe('SetCredentialDto', () => {
  it('accepts a realistic-length apiKey', async () => {
    const errors = await validateDto({
      apiKey: 'sk-ant-api03-sample-key-not-real-1234',
    });
    expect(errors).toHaveLength(0);
  });

  it('accepts a value just under the limit', async () => {
    const errors = await validateDto({
      apiKey: 'a'.repeat(MAX_CREDENTIAL_VALUE_LENGTH - 1),
    });
    expect(errors).toHaveLength(0);
  });

  it('accepts a value of exactly the permitted character count', async () => {
    const errors = await validateDto({
      apiKey: 'a'.repeat(MAX_CREDENTIAL_VALUE_LENGTH),
    });
    expect(errors).toHaveLength(0);
  });

  it('rejects a value just over the limit', async () => {
    const errors = await validateDto({
      apiKey: 'a'.repeat(MAX_CREDENTIAL_VALUE_LENGTH + 1),
    });
    expect(errors.length).toBeGreaterThan(0);
    const apiKeyError = errors.find((e) => e.property === 'apiKey');
    expect(apiKeyError?.constraints).toMatchObject({
      maxLength: `apiKey must not exceed ${MAX_CREDENTIAL_VALUE_LENGTH} characters`,
    });
  });

  it('accepts a multi-byte value of exactly the permitted character count', async () => {
    const errors = await validateDto({
      apiKey: '記'.repeat(MAX_CREDENTIAL_VALUE_LENGTH),
    });
    expect(errors).toHaveLength(0);
  });

  it('rejects a multi-byte value just over the limit', async () => {
    const errors = await validateDto({
      apiKey: '記'.repeat(MAX_CREDENTIAL_VALUE_LENGTH + 1),
    });
    expect(errors.length).toBeGreaterThan(0);
    const apiKeyError = errors.find((e) => e.property === 'apiKey');
    expect(apiKeyError?.constraints).toHaveProperty('maxLength');
  });

  it('applies the same limit to the value property name', async () => {
    const ok = await validateDto({
      value: 'b'.repeat(MAX_CREDENTIAL_VALUE_LENGTH),
    });
    expect(ok).toHaveLength(0);

    const over = await validateDto({
      value: 'b'.repeat(MAX_CREDENTIAL_VALUE_LENGTH + 1),
    });
    const valueError = over.find((e) => e.property === 'value');
    expect(valueError?.constraints).toMatchObject({
      maxLength: `value must not exceed ${MAX_CREDENTIAL_VALUE_LENGTH} characters`,
    });
  });

  it('constraint messages name the property and limit, not the submitted value', async () => {
    const errors = await validateDto({
      apiKey: 'x'.repeat(MAX_CREDENTIAL_VALUE_LENGTH + 1),
    });
    const apiKeyError = errors.find((e) => e.property === 'apiKey');
    const messages = Object.values(apiKeyError?.constraints ?? {});
    expect(messages).toEqual([
      `apiKey must not exceed ${MAX_CREDENTIAL_VALUE_LENGTH} characters`,
    ]);
    // class-validator keeps the raw value on the error object for debugging;
    // the HTTP layer only surfaces `constraints` (covered by the e2e).
    for (const message of messages) {
      expect(message).not.toMatch(/^x{10,}/);
    }
  });
});
