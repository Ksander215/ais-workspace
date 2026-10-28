/**
 * Backend regression tests — bugs found in the SIP server audit.
 *
 * 1. nmap XML parser found nothing: the regex used `.`, which never matches
 *    a newline, and nmap -oX prints every element on its own line.
 * 2. A failed tool (exit 127, command not found) was reported as a successful
 *    scan with exitCode 0 and zero findings.
 * 3. A cancelled scan was stored as "completed".
 * 4. Duplicate finding IDs (FND-TRIVY-001 twice) merged distinct findings.
 * 5. Risk score: one high finding scored 100/100, and info findings diluted
 *    a critical one down to 2.
 * 6. Two projects created in the same second got the same id and one
 *    overwrote the other.
 * 7. Corrupted store file was silently replaced with defaults on the next write.
 * 8. Invalid findings in the request body produced 500 instead of 400.
 * 9. Attack path pointed at another asset than the finding's own.
 * 10. CSV export broke on commas and newlines inside fields.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const NMAP_XML = `<?xml version="1.0"?>
<nmaprun scanner="nmap">
<host><address addr="10.0.0.5" addrtype="ipv4"/><hostnames></hostnames>
<ports>
<port protocol="tcp" portid="22">
<state state="open" reason="syn-ack" reason_ttl="64"/>
<service name="ssh" product="OpenSSH" version="8.9p1"/>
</port>
<port protocol="tcp" portid="3306">
<state state="open" reason="syn-ack" reason_ttl="64"/>
<service name="mysql" product="MySQL" version="8.0.35"/>
</port>
<port protocol="tcp" portid="23">
<state state="filtered" reason="no-response" reason_ttl="0"/>
<service name="telnet"/>
</port>
</ports>
</host>
</nmaprun>`;

describe('nmap XML parser', () => {
  it('parses real multi-line nmap -oX output', async () => {
    const { nmapParser } = await import('../parsers/index.js');
    const findings = nmapParser.parse(NMAP_XML, '10.0.0.5');
    expect(findings).toHaveLength(2);
    const ports = findings.map((f) => f.metadata?.port).sort();
    expect(ports).toEqual(["22", "3306"]);
    expect(findings.every((f) => f.id.startsWith("FND-NMAP-"))).toBe(true);
    expect(new Set(findings.map((f) => f.id)).size).toBe(2);
  });

  it('ignores ports that are not open', async () => {
    const { nmapParser } = await import('../parsers/index.js');
    const findings = nmapParser.parse(NMAP_XML, '10.0.0.5');
    expect(findings.some((f) => f.metadata?.port === "23")).toBe(false);
  });
});

describe('trivy / ZAP finding ids', () => {
  it('gives every trivy finding a unique id', async () => {
    const { trivyParser } = await import('../parsers/index.js');
    const raw = JSON.stringify({
      Results: [
        { Target: "a", Vulnerabilities: [{ Title: "v1", Severity: "HIGH" }, { Title: "v2", Severity: "LOW" }] },
        { Target: "b", Vulnerabilities: [{ Title: "v3", Severity: "CRITICAL" }] },
      ],
    });
    const findings = trivyParser.parse(raw, "x");
    expect(findings).toHaveLength(3);
    expect(new Set(findings.map((f) => f.id)).size).toBe(3);
  });
});

describe('risk score', () => {
  const finding = (severity: any, cvss: number) => ({
    id: "F1", tool: "t", asset: "a", severity, title: "t", description: "d",
    cvss, evidence: "", recommendation: "", references: [], status: "open",
    discoveredAt: new Date().toISOString(), metadata: {},
  } as any);

  it('does not let informational findings dilute a critical one', async () => {
    const { calculateRiskScore } = await import('../services/scanner.js');
    const critical = finding("critical", 9.8);
    const info = Array.from({ length: 100 }, (_, i) => finding("info", 0) as any);
    const score = calculateRiskScore([critical, ...info]);
    expect(score).toBeGreaterThanOrEqual(90);
  });

  it('scores a single high finding below a single critical one', async () => {
    const { calculateRiskScore } = await import('../services/scanner.js');
    const critical = calculateRiskScore([finding("critical", 9.8)]);
    const high = calculateRiskScore([finding("high", 7.5)]);
    expect(critical).toBeGreaterThan(high);
  });
});

describe('project ids and store durability', () => {
  let dataDir: string;

  beforeEach(() => {
    dataDir = mkdtempSync(resolve(tmpdir(), 'sip-store-'));
    process.env.SIP_DATA_DIR = dataDir;
    vi.resetModules();
  });

  afterEach(() => {
    rmSync(dataDir, { recursive: true, force: true });
    delete process.env.SIP_DATA_DIR;
  });

  it('never reuses a project id', async () => {
    const store = await import('../services/store.js');
    const a = store.createProject("A", "");
    const b = store.createProject("B", "");
    expect(a.id).not.toBe(b.id);
    const names = store.getProjects().map((p) => p.name);
    expect(names).toContain("A");
    expect(names).toContain("B");
    expect(new Set(store.getProjects().map((p) => p.id)).size).toBe(store.getProjects().length);
  });

  it('keeps a corrupted store file instead of overwriting it with defaults', async () => {
    writeFileSync(resolve(dataDir, "projects.json"), "{ this is not json", "utf-8");
    const store = await import('../services/store.js');
    store.createProject("A", "");
    const files = readdirSync(dataDir);
    expect(files.some((f) => f.includes("corrupt"))).toBe(true);
    // the damaged file itself is still there, moved aside
    expect(files.some((f) => f.startsWith("projects.json.corrupt"))).toBe(true);
    // and the live file is valid JSON now
    expect(() => JSON.parse(readFileSync(resolve(dataDir, "projects.json"), "utf-8"))).not.toThrow();
  });
});

describe('analysis routes validate findings', () => {
  it('answers 400 instead of 500 for incomplete findings', async () => {
    const express = (await import('express')).default;
    const { analysisRouter } = await import('../routes/analysis.js');
    const app = express();
    app.use(express.json());
    app.use((_req, res, next) => { res.locals.next = next; next(); });
    app.use("/api/analysis", analysisRouter);

    const server = app.listen(0);
    const port = (server.address() as any).port;
    try {
      for (const path of ["knowledge-graph", "attack-paths", "recommendations", "report"]) {
        const res = await fetch(`http://127.0.0.1:${port}/api/analysis/${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ findings: [{ id: "x" }] }),
        });
        expect(res.status, path).toBe(400);
      }
    } finally {
      server.close();
    }
  }, 30_000);
});

describe('attack paths use the finding asset', () => {
  it('builds the path through the asset of the finding', async () => {
    const { buildAttackPaths } = await import('../services/attack-paths.js');
    const make = (asset: string, title: string) => ({
      id: `F-${asset}`, tool: "t", asset, severity: "critical" as const, title,
      description: "", cvss: 9.8, evidence: "", recommendation: "",
      references: [], status: "open", discoveredAt: new Date().toISOString(), metadata: {},
    } as any);
    const result = buildAttackPaths([
      make("hostA", "SQL Injection"),
      make("hostB", "Cross-site scripting"),
    ]);
    const appIds = result.nodes.filter((n) => n.type === "app").map((n) => n.id);
    expect(appIds).toContain("app-hostA");
    expect(appIds).toContain("app-hostB");
    const xssPath = result.paths.find((p) => p.name.includes("XSS"));
    expect(xssPath).toBeDefined();
    expect(xssPath!.nodes).toContain("app-hostB");
    expect(xssPath!.nodes).not.toContain("app-hostA");
  });
});

describe('CSV export', () => {
  it('quotes every cell so commas and newlines do not break the row', async () => {
    const { exportAsCSV } = await import('../services/reports.js');
    const csv = exportAsCSV([{
      id: "F1", tool: "nmap", asset: "a,b", severity: "high" as const,
      title: 'title "quoted"', description: "line1\nline2", cvss: 7,
      evidence: "", recommendation: "fix", references: [], status: "open",
      discoveredAt: new Date().toISOString(), metadata: {},
    } as any]);
    const row = csv.split("\n")[1];
    expect(row).toBe('"F1","nmap","a,b","high","title ""quoted""","7","","","line1 line2","fix","open"');
  });
});
