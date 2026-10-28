# Security Policy — AIS

This repository contains AIS, the main product, and the auxiliary SIP product that now lives inside it. This policy applies to the repository generally; security-sensitive findings should be reported privately rather than through public Issues.

## Reporting

Do not publish an unpatched vulnerability, credentials, tokens, private data, or an exploit in a public Issue or Pull Request. Contact the repository owner privately through an appropriate secure channel.

When reporting a vulnerability, include:
- affected component/file;
- reproducible conditions;
- impact;
- minimal proof of concept where safe;
- relevant commit/version;
- suggested mitigation if known.

## Development requirements

- Never commit API keys, tokens, passwords, private keys, or credentials.
- Keep secrets in environment variables or GitHub encrypted secrets.
- Treat repository contents and imported projects as untrusted input.
- Validate and sanitize external input.
- Preserve path traversal and repository-boundary protections.
- Do not weaken security controls merely to make a demo pass.
- External provider credentials must never be written into project persistence.

## Dependency and CI hygiene

Dependency changes require review and should be checked for known vulnerabilities.

CI must not print secrets or persist credentials in artifacts.

## Scope

This policy is intentionally narrower than a production security program. It does not claim that the current MVP has enterprise-grade authentication, authorization, isolation, or compliance controls.

For the auxiliary SIP product, historical SIP-specific documentation remains in its own code/docs area and should not be treated as evidence of AIS production security posture.
