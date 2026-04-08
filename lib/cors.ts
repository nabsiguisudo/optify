import { NextResponse } from "next/server";

export function withCors(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, ngrok-skip-browser-warning");
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}

export function corsPreflight() {
  return withCors(new NextResponse(null, { status: 204 }));
}
