import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacidade e proteção de dados | AURA SYSTEM",
  description: "Aviso de privacidade da versão demonstrativa do AURA SYSTEM.",
};

const sections = [
  {
    title: "1. Sobre esta versão",
    body: "Esta instância é uma demonstração acadêmica do AURA SYSTEM. Os painéis e indicadores exibidos utilizam dados fictícios de demonstração. Não insira nomes, documentos, contatos, notas, informações de saúde ou quaisquer dados reais de estudantes, responsáveis ou profissionais.",
  },
  {
    title: "2. Dados e finalidades",
    body: "Em uma implantação real, o sistema poderá tratar dados cadastrais e de contato, vínculos escolares, matrículas, turmas, notas, frequência e registros administrativos. Esses dados só poderão ser tratados para finalidades escolares determinadas, legítimas e informadas, com acesso limitado a quem precisa deles para exercer suas atribuições.",
  },
  {
    title: "3. Crianças e adolescentes",
    body: "O tratamento de dados de crianças e adolescentes deverá observar seu melhor interesse, com transparência adequada à idade, medidas de segurança reforçadas e participação dos responsáveis quando exigida pela legislação. A base legal deve ser definida para cada finalidade; consentimento não é a única hipótese legal prevista na LGPD.",
  },
  {
    title: "4. Acesso e segurança",
    body: "O projeto prevê autenticação, perfis de acesso e separação lógica por organização e escola. Esses mecanismos ainda precisam ser validados por testes técnicos independentes antes de qualquer uso com dados reais. Senhas de demonstração são públicas e não devem ser reutilizadas em produção.",
  },
  {
    title: "5. Direitos dos titulares",
    body: "Em uma implantação, o titular ou seu representante poderá solicitar, conforme aplicável, confirmação e acesso aos dados, correção, informações sobre o tratamento e demais direitos previstos na LGPD. O canal oficial, o responsável pelo atendimento e os prazos deverão ser definidos pela instituição controladora antes da entrada em operação.",
  },
  {
    title: "6. Controlador, operador e contato",
    body: "A instituição de ensino que decidir as finalidades e os meios do tratamento deverá ser identificada como controladora. O fornecedor do sistema poderá atuar como operador conforme o contrato e a operação efetiva. Os nomes, contatos do encarregado e canal de solicitações ainda precisam ser preenchidos e aprovados pela instituição responsável; esta página não substitui essa definição.",
  },
  {
    title: "7. Retenção, compartilhamento e incidentes",
    body: "Os prazos de retenção, descarte seguro, fornecedores com acesso aos dados, transferências internacionais e procedimento de resposta a incidentes deverão ser documentados antes da produção. Não há, nesta demonstração, compromisso de que esses processos estejam integralmente implantados.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-[#f7f8f5] px-5 py-12 text-[#263b31]">
      <article className="mx-auto max-w-3xl rounded-2xl border border-[#dce5dc] bg-white p-7 shadow-sm sm:p-10">
        <Link href="/login" className="text-sm font-medium text-[#315f4e] underline underline-offset-4">
          Voltar ao login
        </Link>
        <p className="mt-8 text-xs font-semibold tracking-[0.16em] text-[#648071]">AURA SYSTEM · GESTÃO ESCOLAR</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Privacidade e proteção de dados</h1>
        <p className="mt-3 text-sm leading-6 text-[#65756b]">
          Aviso informativo da versão demonstrativa. Atualizado em 3 de novembro de 2026.
        </p>
        <div className="mt-7 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <strong>Importante:</strong> este projeto ainda não está certificado nem pode ser considerado plenamente adequado à LGPD.
          A demonstração deve usar exclusivamente dados fictícios. A instituição responsável precisa revisar e completar este aviso
          antes de tratar dados pessoais reais.
        </div>
        <div className="mt-8 space-y-7">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <p className="mt-2 text-sm leading-7 text-[#52665a]">{section.body}</p>
            </section>
          ))}
        </div>
        <p className="mt-10 border-t border-[#e5ebe5] pt-5 text-xs leading-6 text-[#78867d]">
          Referência: Lei nº 13.709/2018 (LGPD), especialmente os princípios, bases legais, direitos dos titulares,
          tratamento de dados de crianças e adolescentes e deveres de segurança. Este texto é um aviso provisório
          para apresentação acadêmica, não aconselhamento jurídico nem política final de uma instituição.
        </p>
      </article>
    </main>
  );
}
