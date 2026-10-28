import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Upper bound on a stored provider credential.
 *
 * Real provider keys are short (roughly 40–200 characters). A few thousand
 * characters still leaves room for long opaque tokens from
 * `openai_compatible` / local setups without accepting a pasted `.env` file
 * or a 400 KB blob that then gets encrypted and stored.
 */
export const MAX_CREDENTIAL_VALUE_LENGTH = 4096;

/**
 * Request body for `PUT /api/v1/providers/:providerId/credential`.
 *
 * Accepts either `apiKey` or `value` as the property name for the credential
 * secret. Replaces any existing credential for the provider.
 *
 * Validation rules:
 * - Empty or whitespace-only inputs are rejected with 400 Bad Request.
 * - Non-string values are rejected with 400 Bad Request.
 * - Values longer than {@link MAX_CREDENTIAL_VALUE_LENGTH} characters are
 *   rejected with 400 Bad Request.
 * - Unknown properties are rejected by the global validation pipe.
 * - The plaintext secret is never echoed in error messages.
 */
export class SetCredentialDto {
  @ApiPropertyOptional({
    description: 'API key or credential secret for the provider',
    example: 'sk-ant-api03-sample-key-1234',
    maxLength: MAX_CREDENTIAL_VALUE_LENGTH,
  })
  @IsOptional()
  @IsString({ message: 'apiKey must be a string' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(1, { message: 'apiKey must not be empty' })
  @MaxLength(MAX_CREDENTIAL_VALUE_LENGTH, {
    message: `apiKey must not exceed ${MAX_CREDENTIAL_VALUE_LENGTH} characters`,
  })
  apiKey?: string;

  @ApiPropertyOptional({
    description: 'Alternative property name for the credential secret',
    example: 'sk-ant-api03-sample-key-1234',
    maxLength: MAX_CREDENTIAL_VALUE_LENGTH,
  })
  @IsOptional()
  @IsString({ message: 'value must be a string' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(1, { message: 'value must not be empty' })
  @MaxLength(MAX_CREDENTIAL_VALUE_LENGTH, {
    message: `value must not exceed ${MAX_CREDENTIAL_VALUE_LENGTH} characters`,
  })
  value?: string;
}
