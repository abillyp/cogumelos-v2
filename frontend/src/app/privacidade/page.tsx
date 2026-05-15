// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.

export default function PrivacidadePage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px', fontFamily: 'Arial, sans-serif', color: '#333', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', marginBottom: 4 }}>Politica de Privacidade</h1>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 32 }}>
        Última atualização: maio de 2026 — Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD)
      </p>

      <Section titulo="1. Controlador dos Dados">
        O controlador dos dados pessoais coletados por este serviço é:{' '}
        <strong>Alessandro Billy Palma</strong>, responsável pela plataforma cogumelos.app.<br />
        Contato do encarregado (DPO): <a href="mailto:privacidade@cogumelos.app" style={{ color: '#2D6A4F' }}>privacidade@cogumelos.app</a>
      </Section>

      <Section titulo="2. Dados Pessoais Coletados">
        Coletamos apenas os dados necessários para a prestação do serviço (princípio da minimização, Art. 6º, III):
        <ul style={{ paddingLeft: 20, margin: '8px 0 0' }}>
          <li><strong>Nome completo</strong> — identificação do titular na plataforma.</li>
          <li><strong>Endereço de e-mail</strong> — autenticação, comunicações e recuperação de senha.</li>
          <li><strong>Senha</strong> — armazenada exclusivamente em formato hash (BCrypt). Não temos acesso à senha original.</li>
          <li><strong>Nome do produtor / empresa</strong> — personalização do espaço de trabalho.</li>
          <li><strong>Data de criação da conta</strong> — controle interno e auditoria.</li>
          <li><strong>Data e hora de aceite dos termos</strong> — registro do consentimento (Art. 8º, §5º).</li>
          <li><strong>Dados operacionais</strong> — experimentos, formulações e insumos inseridos pelo próprio titular.</li>
        </ul>
        Não coletamos dados sensíveis conforme definição do Art. 5º, II da LGPD.
      </Section>

      <Section titulo="3. Base Legal para o Tratamento">
        O tratamento dos dados é realizado com as seguintes bases legais (Art. 7º):
        <ul style={{ paddingLeft: 20, margin: '8px 0 0' }}>
          <li><strong>Consentimento (I)</strong> — coletado no momento do registro, com registro de data e hora.</li>
          <li><strong>Execução de contrato (V)</strong> — dados necessários para prestação do serviço contratado.</li>
          <li><strong>Legítimo interesse (IX)</strong> — segurança da plataforma e prevenção a fraudes.</li>
        </ul>
      </Section>

      <Section titulo="4. Finalidade do Tratamento">
        Os dados são utilizados exclusivamente para:
        <ul style={{ paddingLeft: 20, margin: '8px 0 0' }}>
          <li>Autenticação e controle de acesso ao sistema.</li>
          <li>Personalização da experiência do usuário.</li>
          <li>Comunicações transacionais (recuperação de senha, avisos de conta).</li>
          <li>Cumprimento de obrigações legais.</li>
        </ul>
        Não utilizamos seus dados para publicidade, perfilamento ou venda a terceiros.
      </Section>

      <Section titulo="5. Compartilhamento com Terceiros">
        Compartilhamos dados com os seguintes parceiros tecnológicos, estritamente para operação do serviço:
        <ul style={{ paddingLeft: 20, margin: '8px 0 0' }}>
          <li><strong>Google OAuth2</strong> — autenticação opcional via conta Google. Ao utilizar este método, o e-mail e nome do Google são compartilhados conosco. Consulte a <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#2D6A4F' }}>Política de Privacidade do Google</a>.</li>
          <li><strong>Provedor de e-mail transacional</strong> — envio de mensagens de recuperação de senha.</li>
          <li><strong>Provedor de hospedagem (servidor)</strong> — armazenamento dos dados em servidores seguros.</li>
        </ul>
        Todos os parceiros são obrigados contratualmente a manter a confidencialidade dos dados.
      </Section>

      <Section titulo="6. Segurança dos Dados">
        Adotamos as seguintes medidas técnicas de segurança (Art. 46):
        <ul style={{ paddingLeft: 20, margin: '8px 0 0' }}>
          <li>Senhas armazenadas com hash BCrypt.</li>
          <li>Tokens de sessão (JWT) transmitidos exclusivamente em cookies HttpOnly e Secure, inacessíveis via JavaScript.</li>
          <li>Isolamento total de dados entre contas (multi-tenancy).</li>
          <li>Limite de tentativas de login (rate limiting) para prevenir ataques de força bruta.</li>
          <li>Tokens de recuperação de senha com expiração de 1 hora e uso único.</li>
          <li>Comunicação via HTTPS em todos os ambientes de produção.</li>
        </ul>
      </Section>

      <Section titulo="7. Retenção de Dados">
        Os dados pessoais são mantidos enquanto a conta estiver ativa. Ao encerrar a conta, todos os dados são apagados permanentemente e imediatamente,
        sem possibilidade de recuperação. Não mantemos backups individuais por titular após o encerramento.
      </Section>

      <Section titulo="8. Seus Direitos como Titular (Art. 18)">
        Você tem os seguintes direitos, exercíveis diretamente pela plataforma ou via contato:
        <ul style={{ paddingLeft: 20, margin: '8px 0 0' }}>
          <li><strong>Acesso (II)</strong> — visualize seus dados no perfil do sistema.</li>
          <li><strong>Correção (III)</strong> — atualize seu nome diretamente no perfil.</li>
          <li><strong>Portabilidade (V)</strong> — exporte todos os seus dados em formato JSON pelo perfil (botão "Exportar meus dados").</li>
          <li><strong>Eliminação (VI)</strong> — encerre sua conta pelo perfil (botão "Encerrar conta e apagar dados"). A ação é imediata e irreversível.</li>
          <li><strong>Revogação do consentimento (IX)</strong> — você pode revogar seu consentimento a qualquer momento encerrando a conta.</li>
          <li><strong>Informação sobre compartilhamento (VII)</strong> — descrito na seção 5 acima.</li>
          <li><strong>Oposição (XI)</strong> — entre em contato pelo e-mail abaixo para questionar tratamentos específicos.</li>
        </ul>
        Para exercer direitos que não estejam disponíveis diretamente na plataforma, entre em contato em até 15 dias úteis via{' '}
        <a href="mailto:privacidade@cogumelos.app" style={{ color: '#2D6A4F' }}>privacidade@cogumelos.app</a>.
      </Section>

      <Section titulo="9. Notificação de Incidentes">
        Em caso de incidente de segurança que possa acarretar risco ou dano relevante aos titulares, notificaremos a ANPD e os usuários afetados
        em prazo razoável, conforme exigido pelo Art. 48 da LGPD.
      </Section>

      <Section titulo="10. Cookies">
        Utilizamos apenas cookies estritamente necessários para o funcionamento do sistema:
        <ul style={{ paddingLeft: 20, margin: '8px 0 0' }}>
          <li><strong>accessToken</strong> — autenticação da sessão ativa (HttpOnly, Secure, expira em 15 minutos).</li>
          <li><strong>refreshToken</strong> — renovação de sessão (HttpOnly, Secure, expira em 8 horas).</li>
        </ul>
        Não utilizamos cookies de rastreamento, publicidade ou analytics de terceiros.
      </Section>

      <Section titulo="11. Alterações nesta Politica">
        Eventuais alterações serão comunicadas por e-mail e/ou aviso no sistema. O uso continuado após a vigência das alterações constitui aceitação.
        A versão anterior ficará disponível mediante solicitação.
      </Section>

      <Section titulo="12. Contato e Canal de Atendimento ao Titular">
        Para exercer seus direitos ou esclarecer dúvidas sobre privacidade:
        <ul style={{ paddingLeft: 20, margin: '8px 0 0' }}>
          <li>E-mail do encarregado (DPO): <a href="mailto:privacidade@cogumelos.app" style={{ color: '#2D6A4F' }}>privacidade@cogumelos.app</a></li>
          <li>Contato geral: <a href="mailto:contato@cogumelos.app" style={{ color: '#2D6A4F' }}>contato@cogumelos.app</a></li>
        </ul>
        Respondemos em até 15 dias uteis, conforme Art. 18, §3º da LGPD.
      </Section>

      <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #EEE', textAlign: 'center' }}>
        <a href="/" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>Voltar ao sistema</a>
        <span style={{ margin: '0 12px', color: '#ccc' }}>|</span>
        <a href="/termos" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>Termos de Uso</a>
      </div>
    </div>
  )
}

function Section({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 8 }}>{titulo}</h2>
      <div style={{ fontSize: 14, color: '#444', margin: 0 }}>{children}</div>
    </div>
  )
}