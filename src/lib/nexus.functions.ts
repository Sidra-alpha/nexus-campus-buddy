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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function uuid(value: string) {
  if (!UUID.test(value)) throw new Error("Invalid identifier.");
  return value;
}

export const fetchStudents = createServerFn({ method: "GET" }).handler(async () => {
  const { listStudents } = await import("./nexus-data.server");
  return listStudents();
});

export const addStudent = createServerFn({ method: "POST" })
  .inputValidator((input: { name: string; branch: string }) => ({
    name: String(input.name ?? ""),
    branch: String(input.branch ?? ""),
  }))
  .handler(async ({ data }) => {
    const { createStudent } = await import("./nexus-data.server");
    return createStudent(data);
  });

export const fetchWorkspace = createServerFn({ method: "POST" })
  .inputValidator((input: { studentId: string }) => ({ studentId: uuid(input.studentId) }))
  .handler(async ({ data }) => {
    const { loadWorkspace } = await import("./nexus-data.server");
    return loadWorkspace(data.studentId);
  });

export const fetchSessionState = createServerFn({ method: "POST" })
  .inputValidator((input: { sessionId: string }) => ({ sessionId: uuid(input.sessionId) }))
  .handler(async ({ data }) => {
    const { loadSessionState } = await import("./nexus-data.server");
    return loadSessionState(data.sessionId);
  });
