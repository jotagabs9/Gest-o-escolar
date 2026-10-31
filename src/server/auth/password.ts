import bcrypt from "bcryptjs";

const COST = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

let dummyHash: Promise<string> | undefined;

/**
 * Compara a senha com o hash. Quando o usuário não existe (`hash` nulo), compara com um hash fictício
 * para o tempo de resposta não revelar se o e-mail está cadastrado.
 */
export async function verifyPassword(plain: string, hash: string | null | undefined): Promise<boolean> {
  if (!hash) {
    dummyHash ??= bcrypt.hash("senha-fictícia-para-igualar-o-tempo", COST);
    await bcrypt.compare(plain, await dummyHash);
    return false;
  }
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}
