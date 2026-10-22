// A relative Location preserves the public origin behind the VPS reverse proxy.
export function GET() {
  return new Response(null, { status: 308, headers: { Location: "/register" } });
}
