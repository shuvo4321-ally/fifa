import { getAllWcMatches } from "../../lib/wcMatches";

export const dynamic = "force-dynamic";

// One call returns every WC match's status + score, so the client never has to
// fan out a request per fixture.
export async function GET() {
  const { matches, source } = await getAllWcMatches();
  return Response.json({ matches, source });
}
