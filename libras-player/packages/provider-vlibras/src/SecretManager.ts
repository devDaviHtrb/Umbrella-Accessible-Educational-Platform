// Secret access abstraction for the VLibras self-hosted provider.
//
// Tokens for the self-hosted VLibras Translator API MUST come from a
// backend secret manager — never from the mobile app, the manifest, or a
// checked-in config file (Requirements 17.1, 18.1). This interface keeps
// the provider decoupled from any concrete vault (AWS Secrets Manager,
// Vault, GCP Secret Manager, ...) and makes the token source injectable
// and testable.

/**
 * Backend secret manager used to resolve the API token at generation time.
 *
 * Implementations read from a server-side vault. The token value is never
 * logged, serialized into the manifest, or shipped to the client.
 */
export interface SecretManager {
  /**
   * Resolve the secret value for `secretId`.
   *
   * @returns the secret value, or `undefined` when no such secret exists.
   *   A missing token is treated by the provider as "not authorized",
   *   never as an empty/anonymous call.
   */
  getSecret(secretId: string): Promise<string | undefined>;
}
