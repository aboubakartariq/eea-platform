import { generate } from "../../node_modules/otplib/dist/index.js";
console.log(await generate({ secret: process.argv[2].replace(/\s/g, "") }));
