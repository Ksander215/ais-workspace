/**
 * A tool that fails (command not found, exit 127) used to be reported as a
 * successful scan: exitCode 0, status "completed" and no findings at all.
 * The scan had to look clean, and a missing binary in the Docker image was
 * invisible.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const executeToolMock = vi.fn();

vi.mock('../plugins/runtime.js', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    executeTool: (...args: any[]) => executeToolMock(...args),
  };
});

describe('scan pipeline reports failed tools', () => {
  beforeEach(() => {
    executeToolMock.mockReset();
  });

  it('marks the scan as failed when a tool exits with 127', async () => {
    executeToolMock.mockResolvedValue({
      toolId: "nmap",
      exitCode: 127,
      stdout: "",
      stderr: "sh: nmap: not found",
      duration: 10,
      command: "nmap -oX - 10.0.0.5",
    });

    const { executeScanPipeline } = await import('../services/scanner.js');
    const fakeRes = { writableEnded: false, write: () => {}, end: () => {} } as any;

    const result = await executeScanPipeline(
      {
        projectId: "PRJ-TEST",
        projectName: "Test",
        sourceType: "website",
        sourceValue: "example.com",
        toolIds: ["nmap"],
      },
      "SCAN-TEST",
      fakeRes,
    );

    expect(result.exitCode).toBe(1);
    expect(result.status).toBe("failed");
    expect(result.stderr.join(" ")).toContain("nmap");
  });

  it('keeps the scan successful when the tool works', async () => {
    executeToolMock.mockResolvedValue({
      toolId: "nmap",
      exitCode: 0,
      stdout: "22/tcp open ssh\n",
      stderr: "",
      duration: 10,
      command: "nmap",
    });

    const { executeScanPipeline } = await import('../services/scanner.js');
    const fakeRes = { writableEnded: false, write: () => {}, end: () => {} } as any;

    const result = await executeScanPipeline(
      {
        projectId: "PRJ-TEST",
        projectName: "Test",
        sourceType: "website",
        sourceValue: "example.com",
        toolIds: ["nmap"],
      },
      "SCAN-TEST-2",
      fakeRes,
    );

    expect(result.exitCode).toBe(0);
    expect(result.status).toBe("completed");
    expect(result.findings.length).toBeGreaterThan(0);
  });
});
