import { NextResponse } from "next/server";
import { getCurrencyRates } from "@/lib/currency";

export async function GET() {
  const rates = await getCurrencyRates();
  return NextResponse.json(rates, {
    headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=7200" },
  });
}
