// Gera o hash bcrypt de uma senha para gravar em users.password_hash.
//   node scripts/hash-password.mjs "senha-forte-aqui"
// Dica: rode com um espaço antes do comando para não ficar no histórico do shell, ou use a variável PASSWORD.
import bcrypt from "bcryptjs";

const password = process.argv[2] ?? process.env.PASSWORD;
if (!password) {
  console.error('Uso: node scripts/hash-password.mjs "senha"  (ou PASSWORD=... node scripts/hash-password.mjs)');
  process.exit(1);
}
if (password.length < 10) console.warn("Aviso: use pelo menos 10 caracteres.");
console.log(await bcrypt.hash(password, 12));
