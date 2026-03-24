import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      message: "MobilePay webhook placeholder. Add signature verification and billing sync here."
    },
    { status: 501 }
  );
}
