import { RunService } from "@rbxts/services";
import type { MotionDomain, MotionTargetContract } from "../core/types";

export type MotionDiagnosticStage = "capability" | "read" | "write" | "interpolation" | "conflict";

export type MotionDiagnosticContext = {
  domain: MotionDomain;
  stage: MotionDiagnosticStage;
  propertyKey: string;
  phase?: string;
  instance?: Instance;
  target?: MotionTargetContract;
  detail: string;
};

const emittedDiagnostics = new Set<string>();

function getTargetLabel(target: MotionTargetContract | undefined) {
  if (!target) {
    return "appearance(default)";
  }

  return target.label ? `${target.role}:${target.label}` : target.role;
}

function getInstanceLabel(instance: Instance | undefined) {
  if (!instance) {
    return "unknown instance";
  }

  return `${instance.ClassName}(${instance.Name})`;
}

export function reportMotionDiagnostic(context: MotionDiagnosticContext) {
  if (!RunService.IsStudio()) {
    return;
  }

  const key = `${context.stage}:${context.domain}:${context.phase ?? "unknown"}:${context.propertyKey}:${getTargetLabel(
    context.target,
  )}:${getInstanceLabel(context.instance)}:${context.detail}`;

  if (emittedDiagnostics.has(key)) {
    return;
  }

  emittedDiagnostics.add(key);

  warn(
    `[Motion] ${context.stage} failure while handling ${context.domain}${
      context.phase ? `/${context.phase}` : ""
    } for ${context.propertyKey} on ${getInstanceLabel(context.instance)} using ${getTargetLabel(context.target)}: ${
      context.detail
    }`,
  );
}
