// Gera um AUTH_SECRET aleatório para colar no .env:  npm run auth:secret
import { randomBytes } from "node:crypto";

console.log(`AUTH_SECRET="${randomBytes(32).toString("base64")}"`);
