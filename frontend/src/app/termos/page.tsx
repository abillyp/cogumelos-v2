// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.

export default function TermosPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px', fontFamily: 'Arial, sans-serif', color: '#333', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', marginBottom: 4 }}>Termos de Uso</h1>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 32 }}>Última atualização: maio de 2026</p>

      <Section titulo="1. Aceitação dos Termos">
        Ao criar uma conta no <strong>cogumelos.app</strong>, você declara ter lido, compreendido e concordado com estes Termos de Uso e com a nossa{' '}
        <a href="/privacidade" style={{ color: '#2D6A4F' }}>Política de Privacidade</a>.
        Se não concordar com qualquer disposição, não utilize o serviço.
      </Section>

      <Section titulo="2. Descrição do Serviço">
        O cogumelos.app é uma plataforma SaaS destinada a produtores de cogumelos, oferecendo funcionalidades de gestão de experimentos,
        formulações de substrato, controle de insumos, monitoramento de lotes e relatórios financeiros.
      </Section>

      <Section titulo="3. Conta e Acesso">
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li>Você é responsável pela confidencialidade das suas credenciais de acesso.</li>
          <li>Cada conta está associada a um espaço isolado (tenant). Os dados de diferentes contas não se misturam.</li>
          <li>É permitido o cadastro de usuários adicionais dentro do mesmo espaço pelo administrador da conta.</li>
          <li>Contas inativas por longos períodos poderão ser suspensas mediante aviso prévio.</li>
        </ul>
      </Section>

      <Section titulo="4. Planos e Pagamentos">
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li>Novas contas recebem automaticamente um período de trial de 14 dias.</li>
          <li>Após o trial, é necessária a contratação de um plano pago para continuar utilizando o serviço.</li>
          <li>Os valores e condições dos planos são os vigentes no momento da contratação e podem ser alterados com aviso prévio de 30 dias.</li>
          <li>Não há reembolso proporcional por cancelamento antecipado, salvo disposição legal em contrário.</li>
        </ul>
      </Section>

      <Section titulo="5. Uso Aceitável">
        É proibido utilizar o cogumelos.app para:
        <ul style={{ paddingLeft: 20, margin: '8px 0 0' }}>
          <li>Atividades ilegais ou que violem direitos de terceiros.</li>
          <li>Inserir dados falsos ou enganosos.</li>
          <li>Tentativas de acesso não autorizado a dados de outros usuários.</li>
          <li>Engenharia reversa, cópia ou redistribuição do software.</li>
        </ul>
      </Section>

      <Section titulo="6. Propriedade Intelectual">
        O código-fonte, design, marca e demais elementos do cogumelos.app são protegidos pela Lei Brasileira de Direitos Autorais (Lei nº 9.610/1998).
        Os dados inseridos pelos usuários permanecem de sua propriedade. Concedemos apenas uma licença limitada de uso do software.
      </Section>

      <Section titulo="7. Disponibilidade">
        Empreendemos esforços razoáveis para manter o serviço disponível, mas não garantimos disponibilidade ininterrupta.
        Manutenções programadas serão informadas com antecedência sempre que possível.
      </Section>

      <Section titulo="8. Limitação de Responsabilidade">
        O cogumelos.app não se responsabiliza por perdas de dados decorrentes de uso indevido, falhas de conexão de responsabilidade do usuário
        ou eventos de força maior. Recomendamos exportar periodicamente seus dados via a função disponível no perfil.
      </Section>

      <Section titulo="9. Rescisão">
        Você pode encerrar sua conta a qualquer momento pela opção "Encerrar conta" no seu perfil. O encerramento apaga permanentemente todos os
        seus dados, conforme o direito ao esquecimento previsto na LGPD (Art. 18, VI).
        Reservamo-nos o direito de suspender contas que violem estes Termos.
      </Section>

      <Section titulo="10. Alterações nos Termos">
        Podemos atualizar estes Termos periodicamente. Alterações substanciais serão comunicadas por e-mail ou aviso no sistema com pelo menos
        15 dias de antecedência. O uso continuado após a vigência das alterações constitui aceitação.
      </Section>

      <Section titulo="11. Lei Aplicável e Foro">
        Estes Termos são regidos pela legislação brasileira. Fica eleito o foro da comarca de São Paulo/SP para dirimir eventuais conflitos,
        com renúncia a qualquer outro, por mais privilegiado que seja.
      </Section>

      <Section titulo="12. Contato">
        Dúvidas sobre estes Termos: <a href="mailto:contato@cogumelos.app" style={{ color: '#2D6A4F' }}>contato@cogumelos.app</a>
      </Section>

      <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #EEE', textAlign: 'center' }}>
        <a href="/" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>Voltar ao sistema</a>
        <span style={{ margin: '0 12px', color: '#ccc' }}>|</span>
        <a href="/privacidade" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>Politica de Privacidade</a>
      </div>
    </div>
  )
}

function Section({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 8 }}>{titulo}</h2>
      <p style={{ fontSize: 14, color: '#444', margin: 0 }}>{children}</p>
    </div>
  )
}