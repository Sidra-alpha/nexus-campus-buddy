import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function uuid(value: string) {
  if (!UUID.test(value)) throw new Error("Invalid identifier.");
  return value;
}

export const fetchMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getStudentIdForUser } = await import("./nexus-data.server");
    return { studentId: await getStudentIdForUser(context.userId) };
  });

export const createMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { name: string; branch: string }) => ({
    name: String(input.name ?? ""),
    branch: String(input.branch ?? ""),
  }))
  .handler(async ({ data, context }) => {
    const { createStudentForUser } = await import("./nexus-data.server");
    const email = (context.claims["email"] as string | undefined) ?? null;
    return createStudentForUser(context.userId, { ...data, email });
  });

export const fetchWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireStudentIdForUser, loadWorkspace } = await import("./nexus-data.server");
    const studentId = await requireStudentIdForUser(context.userId);
    return loadWorkspace(studentId);
  });

export const fetchSessionState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sessionId: string }) => ({ sessionId: uuid(input.sessionId) }))
  .handler(async ({ data, context }) => {
    const { requireStudentIdForUser, assertSessionOwned, loadSessionState } = await import(
      "./nexus-data.server"
    );
    const studentId = await requireStudentIdForUser(context.userId);
    await assertSessionOwned(data.sessionId, studentId);
    return loadSessionState(data.sessionId);
  });

export const runOrchestrator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sessionId: string; message: string; language: string }) => ({
    sessionId: uuid(input.sessionId),
    message: String(input.message ?? "").slice(0, 2000),
    language: String(input.language ?? "en").slice(0, 5),
  }))
  .handler(async ({ data, context }) => {
    const { requireStudentIdForUser, assertSessionOwned } = await import("./nexus-data.server");
    const studentId = await requireStudentIdForUser(context.userId);
    await assertSessionOwned(data.sessionId, studentId);
    const { orchestrate } = await import("./nexus-agents.server");
    return orchestrate({ ...data, studentId });
  });

export const decideApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { approvalId: string; approve: boolean }) => ({
    approvalId: uuid(input.approvalId),
    approve: Boolean(input.approve),
  }))
  .handler(async ({ data, context }) => {
    const { requireStudentIdForUser, assertApprovalOwned } = await import("./nexus-data.server");
    const studentId = await requireStudentIdForUser(context.userId);
    await assertApprovalOwned(data.approvalId, studentId);
    const { resolveApproval } = await import("./nexus-agents.server");
    return resolveApproval(data);
  });

export const triggerSentinel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireStudentIdForUser } = await import("./nexus-data.server");
    const studentId = await requireStudentIdForUser(context.userId);
    const { runSentinel } = await import("./nexus-agents.server");
    return runSentinel(studentId);
  });
