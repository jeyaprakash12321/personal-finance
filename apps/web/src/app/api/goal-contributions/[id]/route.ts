import { NextResponse } from "next/server";
import { authenticatedFetch, forwardApiResponse } from "../../../../lib/api-client";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  const { id } = await context.params;

  const response = await authenticatedFetch(`/goal-contributions/${id}`, {
    method: "DELETE",
  });

  if (response instanceof NextResponse) {
    return response;
  }

  return forwardApiResponse(response);
}
