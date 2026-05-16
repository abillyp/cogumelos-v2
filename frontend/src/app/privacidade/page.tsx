// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.

import Link from 'next/link'

export default function PrivacidadePage() {
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 80px', fontFamily: 'Georgia, serif', color: '#222', lineHeight: 1.8 }}>

      {/* Navegação rápida */}
      <div style={{ fontSize: 13, color: '#888', marginBottom: 32, fontFamily: 'Arial, sans-serif' }}>
        <Link href="/termos" style={{ color: '#888', textDecoration: 'none', borderBottom: '1px solid #ddd' }}>Termos de Uso</Link>
        <span style={{ margin: '0 10px' }}>·</span>
        <Link href="/" style={{ color: '#888', textDecoration: 'none', borderBottom: '1px solid #ddd' }}>Voltar ao sistema</Link>
      </div>

      <h1 style={{ fontSize: 30, fontWeight: 800, fontFamily: 'Arial, sans-serif', color: '#111', marginBottom: 6, lineHeight: 1.2 }}>
        Política de Privacidade
      </h1>
      <p style={{ fontSize: 14, color: '#888', fontFamily: 'Arial, sans-serif', marginBottom: 40 }}>
        Última atualização: maio de 2026 — Em conformidade com a LGPD (Lei nº 13.709/2018)
      </p>

      <Intro />
      <Hr />
      <Section id="controlador" titulo="1. Quem é responsável pelos seus dados">
        <p>
          O <strong>cogumelos.app</strong> é operado por Alessandro Billy Palma, responsável pelo tratamento dos seus dados pessoais na qualidade de controlador.
        </p>
        <p>
          Nosso Encarregado de Proteção de Dados (DPO) pode ser contatado pelo e-mail{' '}
          <a href="mailto:privacidade@cogumelos.app" style={linkStyle}>privacidade@cogumelos.app</a>.
          Respondemos solicitações de titulares em até 15 dias úteis.
        </p>
      </Section>
      <Hr />
      <Section id="coleta" titulo="2. O que coletamos">
        <p>Coletamos apenas o necessário para que o sistema funcione. Nada além disso.</p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <Th>Dado</Th>
              <Th>Por quê coletamos</Th>
            </tr>
          </thead>
          <tbody>
            <Tr a="Nome completo" b="Identificação na plataforma e personalização" />
            <Tr a="E-mail" b="Autenticação, recuperação de acesso e comunicações da conta" />
            <Tr a="Senha" b="Acesso seguro — armazenada de forma irreversível, nunca legível por nós" />
            <Tr a="Nome do produtor ou empresa" b="Configuração do espaço de trabalho" />
            <Tr a="Data de criação da conta" b="Gestão do relacionamento e controle de trial" />
            <Tr a="Registro de aceite dos termos" b="Comprovação de consentimento exigida pela LGPD" />
            <Tr a="Dados operacionais inseridos" b="Experimentos, formulações e insumos — conteúdo exclusivo do titular" />
          </tbody>
        </table>
        <p style={{ fontSize: 14, color: '#555', marginTop: 16 }}>
          Não coletamos dados sensíveis (saúde, biometria, origem racial, convicções religiosas ou políticas).
        </p>
      </Section>
      <Hr />
      <Section id="uso" titulo="3. Como usamos suas informações">
        <p>Suas informações são usadas exclusivamente para:</p>
        <ul style={ulStyle}>
          <li>Operar e manter o serviço que você contratou</li>
          <li>Autenticar seu acesso e proteger sua conta</li>
          <li>Enviar comunicações transacionais (recuperação de senha, avisos de expiração)</li>
          <li>Cumprir obrigações legais e responder a solicitações de autoridades competentes</li>
          <li>Melhorar a estabilidade e segurança da plataforma</li>
        </ul>
        <p>
          Não usamos seus dados para publicidade, venda a terceiros ou perfilamento comportamental.
        </p>
      </Section>
      <Hr />
      <Section id="compartilhamento" titulo="4. Com quem compartilhamos">
        <p>
          Seus dados não são vendidos. Compartilhamos apenas com parceiros indispensáveis para operar o serviço, todos sujeitos a obrigações contratuais de confidencialidade:
        </p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <Th>Parceiro</Th>
              <Th>Finalidade</Th>
            </tr>
          </thead>
          <tbody>
            <Tr a="Google (OAuth2)" b="Autenticação opcional via conta Google" />
            <Tr a="Provedor de e-mail" b="Envio de mensagens transacionais da conta" />
            <Tr a="Servidor de hospedagem" b="Armazenamento e processamento dos dados" />
          </tbody>
        </table>
        <p style={{ fontSize: 14, color: '#555', marginTop: 16 }}>
          Podemos compartilhar dados com autoridades quando exigido por lei, ordem judicial ou para proteger direitos e segurança de terceiros.
        </p>
      </Section>
      <Hr />
      <Section id="seguranca" titulo="5. Como protegemos seus dados">
        <p>
          Adotamos medidas de segurança compatíveis com as melhores práticas do setor para proteger suas informações contra acesso não autorizado, perda ou alteração:
        </p>
        <ul style={ulStyle}>
          <li>Senhas nunca são armazenadas em texto legível — passam por transformação irreversível</li>
          <li>Sessões são gerenciadas por credenciais de curta duração, renovadas automaticamente</li>
          <li>Cookies de sessão são configurados para não serem acessíveis por scripts da página</li>
          <li>Cada conta possui um espaço de dados completamente isolado das demais</li>
          <li>Toda comunicação ocorre sob protocolo de segurança (HTTPS)</li>
          <li>Tentativas excessivas de login são bloqueadas automaticamente</li>
        </ul>
        <p style={{ fontSize: 14, color: '#555' }}>
          Nenhum sistema é 100% infalível. Em caso de incidente relevante, notificaremos você e a ANPD conforme o Art. 48 da LGPD.
        </p>
      </Section>
      <Hr />
      <Section id="retencao" titulo="6. Por quanto tempo guardamos seus dados">
        <p>
          Guardamos seus dados enquanto sua conta estiver ativa. Contas inativas com plano expirado ou cancelado são removidas automaticamente após um período de carência de 90 dias — prazo suficiente para que você exporte seus dados antes da exclusão.
        </p>
        <p>
          Se você encerrar a conta manualmente pelo perfil, todos os dados são apagados imediatamente e de forma permanente, sem possibilidade de recuperação.
        </p>
      </Section>
      <Hr />
      <Section id="cookies" titulo="7. Cookies">
        <p>
          Usamos apenas cookies estritamente necessários para o funcionamento do sistema. Não há cookies de rastreamento, publicidade ou analytics de terceiros.
        </p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <Th>Cookie</Th>
              <Th>Finalidade</Th>
              <Th>Duração</Th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Td>accessToken</Td>
              <Td>Mantém sua sessão ativa</Td>
              <Td>15 minutos</Td>
            </tr>
            <tr style={{ background: '#fafafa' }}>
              <Td>refreshToken</Td>
              <Td>Renova sua sessão sem novo login</Td>
              <Td>8 horas</Td>
            </tr>
          </tbody>
        </table>
        <p style={{ fontSize: 14, color: '#555', marginTop: 16 }}>
          Ambos os cookies são configurados como <em>HttpOnly</em> e <em>Secure</em>, invisíveis ao JavaScript da página e transmitidos apenas via HTTPS.
        </p>
      </Section>
      <Hr />
      <Section id="direitos" titulo="8. Seus direitos">
        <p>
          A LGPD garante a você controle sobre seus próprios dados. Veja como exercer cada direito diretamente na plataforma:
        </p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <Th>Direito</Th>
              <Th>Como exercer</Th>
            </tr>
          </thead>
          <tbody>
            <Tr a="Acesso aos seus dados" b="Perfil → Exportar meus dados (download em JSON)" />
            <Tr a="Correção do nome" b="Perfil → campo Nome → Editar" />
            <Tr a="Portabilidade" b="Perfil → Exportar meus dados" />
            <Tr a="Eliminação" b="Perfil → Encerrar conta e apagar dados (imediato e irreversível)" />
            <Tr a="Revogação do consentimento" b="Encerrar a conta revoga automaticamente o consentimento" />
            <Tr a="Oposição ou outros direitos" b="E-mail: privacidade@cogumelos.app" />
          </tbody>
        </table>
      </Section>
      <Hr />
      <Section id="contato" titulo="9. Contato">
        <p>
          Para qualquer questão sobre privacidade, exercício de direitos ou dúvidas sobre esta política:
        </p>
        <ul style={ulStyle}>
          <li>
            <strong>Encarregado de Dados (DPO):</strong>{' '}
            <a href="mailto:privacidade@cogumelos.app" style={linkStyle}>privacidade@cogumelos.app</a>
          </li>
          <li>
            <strong>Contato geral:</strong>{' '}
            <a href="mailto:contato@cogumelos.app" style={linkStyle}>contato@cogumelos.app</a>
          </li>
        </ul>
        <p style={{ fontSize: 14, color: '#555' }}>
          Respondemos em até 15 dias úteis, conforme o Art. 18, §3º da LGPD. Se não ficar satisfeito com nossa resposta, você pode
          recorrer à <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" style={linkStyle}>ANPD (Autoridade Nacional de Proteção de Dados)</a>.
        </p>
      </Section>
      <Hr />
      <Section id="alteracoes" titulo="10. Alterações nesta política">
        <p>
          Quando fizermos alterações relevantes, você será avisado por e-mail ou por aviso no sistema antes que entrem em vigor.
          A versão anterior ficará disponível mediante solicitação.
        </p>
      </Section>

    </div>
  )
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function Intro() {
  return (
    <div style={{ background: '#f9f9f7', borderRadius: 12, padding: '20px 24px', marginBottom: 40, fontFamily: 'Arial, sans-serif' }}>
      <p style={{ fontSize: 15, color: '#333', margin: 0, lineHeight: 1.7 }}>
        Nesta política explicamos quais dados pessoais coletamos, por que os coletamos, como os protegemos e quais são seus direitos como titular.
        Lemos cada palavra que escrevemos aqui — e esperamos que você também leia.
      </p>
    </div>
  )
}

function Section({ titulo, children, id }: { titulo: string; children: React.ReactNode; id: string }) {
  return (
    <section id={id} style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Arial, sans-serif', color: '#111', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '.03em' }}>
        {titulo}
      </h2>
      <div style={{ fontSize: 16, color: '#333', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </section>
  )
}

function Hr() {
  return <hr style={{ border: 'none', borderTop: '1px solid #EBEBEB', margin: '0 0 40px' }} />
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 14,
  fontFamily: 'Arial, sans-serif',
}

const linkStyle: React.CSSProperties = {
  color: '#2D6A4F',
  textDecoration: 'none',
  borderBottom: '1px solid #2D6A4F',
}

const ulStyle: React.CSSProperties = {
  paddingLeft: 20,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: '#888', borderBottom: '2px solid #EBEBEB', background: '#fafafa' }}>
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td style={{ padding: '10px 12px', borderBottom: '1px solid #F0F0F0', verticalAlign: 'top', color: '#333' }}>
      {children}
    </td>
  )
}

function Tr({ a, b }: { a: string; b: string }) {
  return (
    <tr>
      <Td><strong>{a}</strong></Td>
      <Td>{b}</Td>
    </tr>
  )
}
