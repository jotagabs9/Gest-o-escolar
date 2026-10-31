> Nota histórica deste lote. Para rodar o projeto, use o `README.md` da raiz; as instruções de "copiar src/" abaixo valiam quando o projeto ainda era montado por partes.

# Gestão Escolar: Lote 4 (Notas, Frequência e Boletim)

Copie `src/` para o projeto (mescla com os Lotes 1 a 3).

## Arquivos dos lotes anteriores que mudaram
- `src/lib/nav.ts`: novos itens do Admin (Notas e frequência, Boletins).
- `src/lib/mock/academic.ts` e `src/lib/mock/people.ts`: correção de um comentário com `*/` dentro do bloco,
  que fechava o comentário antes da hora e causava erro de sintaxe.

## shadcn/ui
Nenhum componente novo.

## Requisitos
Next.js 15+ (params e searchParams como Promise).

## Demonstração
- Professor: entre como Professor (Rafael Nogueira). Em Minhas turmas, Notas e Frequência há um seletor
  "Demonstração: ver como" (só fora de produção) para trocar de professor sem mexer no login.
- Aluno/Responsável: entre como Aluno / Responsável (Carlos Almeida, responsável por Ana Beatriz e Pedro).
