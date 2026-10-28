# Security Policy — AIS

This repository contains AIS only. This policy applies to the repository generally; security-sensitive findings should be reported privately rather than through public Issues.

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
- CI must not print secrets or persist credentials in artifacts.

## Scope

This policy is intentionally narrower than a production security program. It does not claim that the current MVP has enterprise-grade authentication, authorization, isolation, or compliance controls.

Historical SIP-specific documentation that once lived in this repository should not be treated as evidence of AIS production security posture.
