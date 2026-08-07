import { createServerFn } from "@tanstack/react-start";

export const runOrchestrator = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      sessionId: string;
      studentId: string;
      message: string;
      language: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const { orchestrate } = await import("./nexus-agents.server");
    return orchestrate(data);
  });

export const decideApproval = createServerFn({ method: "POST" })
  .inputValidator((input: { approvalId: string; approve: boolean }) => input)
  .handler(async ({ data }) => {
    const { resolveApproval } = await import("./nexus-agents.server");
    return resolveApproval(data);
  });

export const triggerSentinel = createServerFn({ method: "POST" })
  .inputValidator((input: { studentId?: string }) => input)
  .handler(async ({ data }) => {
    const { runSentinel } = await import("./nexus-agents.server");
    return runSentinel(data.studentId);
  });
