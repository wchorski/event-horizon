import fs from "fs";
import path from "path";
import { seedData } from "./seed-data";

const model = "events";

const filePath = path.resolve(`./src/db/seed/${model}.js`);

const data = seedData[model];

const updated = data.map((item) => {
  const now = new Date();

  return {
    ...item,
    host: null,
    timestamp: item.timestamp
      ? `new Date("${item.timestamp}")`
      : `new Date("${now.toISOString()}")`,
    date_created: item.date_created
      ? `new Date("${item.date_created}")`
      : `new Date("${now.toISOString()}")`,
    date_modified: item.date_modified
      ? `new Date("${item.date_modified}")`
      : `new Date("${now.toISOString()}")`,
  };
});

const output =
  "export default [\n" +
  updated
    .map((obj) => {
      return (
        "  " +
        "{\n" +
        Object.entries(obj)
          .map(([key, val]) => {
            if (typeof val === "string" && val.startsWith("new Date")) {
              return `    ${key}: ${val}`;
            }
            return `    ${key}: ${JSON.stringify(val)}`;
          })
          .join(",\n") +
        "\n  }"
      );
    })
    .join(",\n") +
  "\n];\n";

// const updated = data.map((item) => {
//   const now = new Date();

//   return {
//     ...item,
//     date_created: item.date_created
//       ? `new Date("${item.date_created}")`
//       : `new Date("${now.toISOString()}")`,

//     date_modified: item.date_modified
//       ? `new Date("${item.date_modified}")`
//       : `new Date("${now.toISOString()}")`,
//   };
// });

// // IMPORTANT: custom stringify (NOT JSON.stringify)
// const output =
//   "export default [\n" +
//   updated
//     .map((obj) => {
//       return (
//         "  " +
//         "{\n" +
//         Object.entries(obj)
//           .map(([key, val]) => {
//             if (typeof val === "string" && val.startsWith("new Date")) {
//               return `    ${key}: ${val}`;
//             }
//             return `    ${key}: ${JSON.stringify(val)}`;
//           })
//           .join(",\n") +
//         "\n  }"
//       );
//     })
//     .join(",\n") +
//   "\n];\n";

fs.writeFileSync(filePath, output);

console.log(`✅ ${model} Seed Data updated with real Date constructors`);
