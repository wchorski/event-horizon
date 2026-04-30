// === File: src/pages/api/quotes.json.ts ===
// API route to fetch quotes from ZenQuotes (bypasses CORS)
import fs from "node:fs/promises";
import path from "node:path";
const BASE_DIR = path.resolve("public/data");
const filename = "quotes";

export async function GET() {
  try {
    const date = fs.readFile(
      path.join(BASE_DIR, `${filename}-date.json`),
      "utf-8",
    );
    console.log(date);
    //   fs.readFile(path.join(BASE_DIR, `${filename}.json`), "utf-8");

    return new Response(JSON.stringify([{ q: "what is up", a: "my dude" }]), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.log(error);
  }

  //   try {
  //     const response = await fetch("https://zenquotes.io/api/quotes/");
  //     const quotes = await response.json();

  //     await fs.writeFile(path.join(BASE_DIR, name), contents, "utf-8");

  //     return new Response(JSON.stringify(quotes), {
  //       status: 200,
  //       headers: {
  //         "Content-Type": "application/json",
  //         "Access-Control-Allow-Origin": "*",
  //       },
  //     });
  //   } catch (error) {
  //     return new Response(JSON.stringify({ error: "Failed to fetch quotes" }), {
  //       status: 500,
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //     });
  //   }
}
