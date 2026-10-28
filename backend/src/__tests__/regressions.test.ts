/**
 * Regression tests for bugs found in the SIP backend.
 * Run: node ../node_modules/vitest/vitest.mjs run --root backend
 */
import { describe, it, expect } from "vitest";
import { parseOutput } from "../parsers";
import { MANIFESTS_BY_ID } from "../plugins/manifests";
import { buildCommand, isSafeSourceValue, quoteTarget } from "../plugins/runtime";
import { exportAsHTML } from "../services/reports";
import { buildAttackPaths } from "../services/attack-paths";
import type { Finding } from "../types";

// ─── ZAP parser was registered under "zap" while the tool id is "owasp-zap" ──

describe("parser registry", () => {
  it("parses OWASP ZAP output under the real tool id", () => {
    const zapOutput = JSON.stringify({
      site: [
        {
          "@name": "https://example.com",
          alerts: [
            {
              name: "X-Frame-Options Header Missing",
              desc: "X-Frame-Options header is not included",
              riskcode: "1",
              solution: "Set X-Frame-Options",
              pluginid: "10020",
            },
          ],
        },
      ],
    });

    const findings = parseOutput("owasp-zap", zapOutput, "https://example.com");
    expect(findings.length).toBe(1);
    expect(findings[0].tool).toBe("owasp-zap");
    expect(findings[0].severity).toBe("medium");
  });
});

// ─── nmap text fallback was unreachable (regex never throws) ───────────────

describe("nmap parser", () => {
  it("parses plain-text nmap output", () => {
    const textOutput = [
      "Nmap scan report for 10.0.0.5",
      "Host is up (0.01s latency).",
      "Not shown: 977 closed tcp ports (reset)",
      "PORT     STATE SERVICE VERSION",
      "22/tcp   open  ssh     OpenSSH 8.9",
      "3306/tcp open  mysql",
    ].join("\n");

    const findings = parseOutput("nmap", textOutput, "10.0.0.5");
    expect(findings.length).toBe(2);
    expect(findings.map((f) => f.title)).toContain("Open port 22/tcp ssh");
    expect(findings.map((f) => f.title)).toContain("Open port 3306/tcp mysql");
    // 3306 is a high-risk port
    const mysql = findings.find((f) => f.title.includes("3306"));
    expect(mysql?.severity).toBe("high");
  });

  it("still parses XML output", () => {
    const xml = `<port portid="22"><state state="open"/><service name="ssh" product="OpenSSH" version="8.9"/></port>`;
    const findings = parseOutput("nmap", xml, "host");
    expect(findings.length).toBe(1);
    expect(findings[0].severity).toBe("info");
  });
});

// ─── Target was embedded into a shell command without validation ───────────

describe("scan target handling", () => {
  it("rejects shell metacharacters in source values", () => {
    expect(isSafeSourceValue("https://example.com")).toBe(true);
    expect(isSafeSourceValue("10.0.0.1")).toBe(true);
    expect(isSafeSourceValue("/var/www/app")).toBe(true);

    expect(isSafeSourceValue("example.com; rm -rf /")).toBe(false);
    expect(isSafeSourceValue("example.com && whoami")).toBe(false);
    expect(isSafeSourceValue("$(id)")).toBe(false);
    expect(isSafeSourceValue("`id`")).toBe(false);
    expect(isSafeSourceValue("host name")).toBe(false);
    expect(isSafeSourceValue("")).toBe(false);
  });

  it("quotes the target inside the built command", () => {
    const manifest = MANIFESTS_BY_ID["nuclei"];
    const cmd = buildCommand(manifest, "website", "example.com");
    expect(cmd).toContain("'https://example.com'");
    expect(cmd).not.toMatch(/\shttps?:\/\/example\.com\s/);
  });

  it("adds a scheme without losing the quoting", () => {
    const manifest = MANIFESTS_BY_ID["nuclei"];
    const cmd = buildCommand(manifest, "website", "example.com");
    expect(cmd).toContain("'https://example.com'");
    expect(cmd).not.toContain(" 'example.com'");
    expect(cmd.match(/example\.com/g)?.length).toBe(1);
  });

  it("quotes single quotes safely", () => {
    expect(quoteTarget("a'b")).toBe("'a'\\''b'");
  });
});

// ─── Exported HTML report did not escape tool output ──────────────────────

describe("HTML report export", () => {
  it("escapes HTML in findings and project name", () => {
    const finding: Finding = {
      id: "FND-1",
      tool: "nuclei",
      asset: "<img src=x onerror=alert(1)>",
      severity: "high",
      title: "<script>alert('x')</script>",
      description: "desc & <b>bold</b>",
      cvss: 7.5,
      evidence: "<svg onload=1>",
      recommendation: "fix <i>it</i>",
      references: [],
      status: "open",
      discoveredAt: new Date().toISOString(),
    };

    const html = exportAsHTML(
      {
        findings: [finding],
        riskScore: 50,
        recommendations: [],
      },
      "technical",
      "<script>alert('p')</script>",
    );

    expect(html).not.toContain("<script>alert");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&amp;");
  });
});

// ─── Attack paths referenced nodes that were not in the graph ──────────────

describe("attack paths", () => {
  const baseFinding: Finding = {
    id: "FND-XSS",
    tool: "nuclei",
    asset: "https://app.example.com",
    severity: "high",
    title: "Reflected XSS",
    description: "xss",
    cvss: 7,
    cwe: "79",
    evidence: "e",
    recommendation: "r",
    references: [],
    status: "open",
    discoveredAt: new Date().toISOString(),
  };

  it("every node referenced by a path exists in the node list", () => {
    const result = buildAttackPaths([baseFinding]);
    const nodeIds = new Set(result.nodes.map((n) => n.id));
    for (const path of result.paths) {
      for (const nodeId of path.nodes) {
        expect(nodeIds.has(nodeId)).toBe(true);
      }
      for (const edge of path.edges) {
        expect(nodeIds.has(edge.source)).toBe(true);
        expect(nodeIds.has(edge.target)).toBe(true);
      }
    }
  });
});
