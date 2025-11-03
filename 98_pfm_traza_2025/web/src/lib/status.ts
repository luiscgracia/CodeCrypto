export type BadgeVariant = "gray" | "green" | "red" | "yellow" | "blue" | "indigo";

export function transferStatusLabel(status: number): string {
  return status === 0 ? "Pending" : status === 1 ? "Accepted" : status === 2 ? "Rejected" : status === 3 ? "Canceled" : String(status);
}

export function transferStatusVariant(status: number): BadgeVariant {
  return status === 0 ? "yellow" : status === 1 ? "green" : status === 2 ? "red" : status === 3 ? "gray" : "gray";
}

export function userStatusLabel(status: number): string {
  // 0 Pending, 1 Approved, 2 Rejected, 3 Canceled as per enum ordering
  return status === 0 ? "Pending" : status === 1 ? "Approved" : status === 2 ? "Rejected" : status === 3 ? "Canceled" : String(status);
}

export function userStatusVariant(status: number): BadgeVariant {
  return status === 0 ? "yellow" : status === 1 ? "green" : status === 2 ? "red" : status === 3 ? "gray" : "gray";
}
