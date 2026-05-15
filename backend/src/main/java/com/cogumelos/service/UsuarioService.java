/*
 * Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
 * Todos os direitos reservados.
 *
 * Este arquivo é parte do sistema cogumelos.app e está protegido pela
 * Lei Brasileira de Direitos Autorais (Lei nº 9.610/1998).
 * Uso, cópia ou distribuição não autorizados são expressamente proibidos.
 *
 * Contato: alessandro.billy@organico4you.com.br
 */

package com.cogumelos.service;

import com.cogumelos.domain.PasswordResetToken;
import com.cogumelos.domain.Tenant;
import com.cogumelos.domain.Usuario;
import com.cogumelos.dto.usuario.LoginRequest;
import com.cogumelos.dto.usuario.RegistroRequest;
import com.cogumelos.dto.usuario.UsuarioResponse;
import com.cogumelos.dto.usuario.UsuarioUpdateRequest;
import com.cogumelos.enums.Role;
import com.cogumelos.repository.ExperimentoRepository;
import com.cogumelos.repository.FormulacaoRepository;
import com.cogumelos.repository.PasswordResetTokenRepository;
import com.cogumelos.repository.TenantRepository;
import com.cogumelos.repository.UsuarioRepository;
import com.cogumelos.security.TenantContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final BCryptPasswordEncoder encoder;
    private final TenantRepository tenantRepo;
    private final PasswordResetTokenRepository passwordResetRepo;
    private final EmailService emailService;
    private final AuthService authService;
    private final ExperimentoRepository experimentoRepo;
    private final FormulacaoRepository formulacaoRepo;

    public UsuarioService(UsuarioRepository usuarioRepository, BCryptPasswordEncoder encoder,
                          TenantRepository tenantRepo, PasswordResetTokenRepository passwordResetRepo,
                          EmailService emailService, AuthService authService,
                          ExperimentoRepository experimentoRepo, FormulacaoRepository formulacaoRepo) {
        this.usuarioRepository = usuarioRepository;
        this.encoder = encoder;
        this.tenantRepo = tenantRepo;
        this.passwordResetRepo = passwordResetRepo;
        this.emailService = emailService;
        this.authService = authService;
        this.experimentoRepo = experimentoRepo;
        this.formulacaoRepo = formulacaoRepo;
    }

    public UsuarioResponse atualizar(String id,
                                     UsuarioUpdateRequest req) {
        // ✅ busca dentro do tenant
        Usuario u = usuarioRepository.findByIdAndTenantId(id, TenantContext.getTenantId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Usuário não encontrado"));

        if (req.nome() != null) u.setNome(req.nome());
        if (req.role() != null) u.setRole(Role.valueOf(req.role()));
        if (req.ativo() != null) u.setAtivo(req.ativo());

        return UsuarioResponse.from(usuarioRepository.save(u));
    }

    @Transactional
    public Map<String, Object> login(LoginRequest req, int refreshDays) {
        Usuario u = usuarioRepository.findByEmail(req.email())
                .orElseThrow(() -> new RuntimeException("Email ou senha inválidos"));
        if (!u.isAtivo()) throw new RuntimeException("Usuário inativo. Contate o administrador.");
        if (!encoder.matches(req.senha(), u.getSenhaHash()))
            throw new RuntimeException("Email ou senha inválidos");
        return authService.buildLoginResponse(u, refreshDays);
    }

    @Transactional
    public void deletarUsuario(String idUsuario, Long tenantId) {
        // ✅ confirma que pertence ao tenant antes de deletar
        usuarioRepository.findByIdAndTenantId(idUsuario, tenantId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Usuário não encontrado"));

        usuarioRepository.deleteById(idUsuario);
    }

    public UsuarioResponse criar(RegistroRequest req, Role role) {
        if (usuarioRepository.existsByEmail(req.email()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email já cadastrado");

        Usuario u = new Usuario();
        u.setId(UUID.randomUUID().toString());
        u.setNome(req.nome());
        u.setEmail(req.email());
        u.setSenhaHash(encoder.encode(req.senha()));
        u.setRole(role);
        Tenant tenant = tenantRepo.findById(TenantContext.getTenantId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant não encontrado"));
        u.setTenant(tenant); // ✅ vincula ao tenant

        return UsuarioResponse.from(usuarioRepository.save(u));
    }

    public UsuarioResponse criar(RegistroRequest req) {
         return criar(req, Role.PRODUTOR);
    }

    public UsuarioResponse me(String userId) {
        Usuario u = usuarioRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        return UsuarioResponse.from(u);
    }

    @Transactional
    public String alterarSenha(String senhaAtual, String novaSenha, String userId) {

        Usuario u = usuarioRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        if (u.getSenhaHash().equals("OAUTH2_NO_PASSWORD"))
            throw new RuntimeException("Usuários Google não podem alterar senha por aqui.");

        if (!encoder.matches(senhaAtual, u.getSenhaHash()))
            throw new RuntimeException("Senha atual incorreta.");

        u.setSenhaHash(encoder.encode(novaSenha));
        usuarioRepository.save(u);

        return "Senha alterada com sucesso.";
    }

    @Transactional
    public String redefinirSenha(Map<String, String> body) {
        String token = body.get("token");
        String novaSenha = body.get("novaSenha");

        PasswordResetToken prt = passwordResetRepo.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Token inválido"));

        if (!prt.isValido()) throw new RuntimeException("Token expirado ou já utilizado");

        Usuario u = prt.getUsuario();
        u.setSenhaHash(encoder.encode(novaSenha));
        usuarioRepository.save(u);

        prt.setUsado(true);
        passwordResetRepo.save(prt);

        return "Senha redefinida com sucesso.";
    }

    @Transactional(readOnly = true)
    public Map<String, Object> exportarDados(String userId) {
        Usuario u = usuarioRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        Long tenantId = u.getTenant().getId();

        var experimentos = experimentoRepo.findByTenantIdOrderByDataPreparoDesc(tenantId)
                .stream().map(e -> Map.of(
                        "codigo", (Object) e.getCodigo(),
                        "dataPreparo", e.getDataPreparo().toString(),
                        "fase", e.getFaseAtual().name(),
                        "totalBlocos", e.getTotalBlocos()
                )).toList();

        var formulacoes = formulacaoRepo.findByTenantIdOrderByCriadoEmDesc(tenantId)
                .stream().map(f -> Map.of(
                        "nome", (Object) f.getNome(),
                        "criadoEm", f.getCriadoEm().toString(),
                        "status", f.getStatus().name()
                )).toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("exportadoEm", LocalDateTime.now().toString());
        result.put("usuario", Map.of(
                "nome", u.getNome(),
                "email", u.getEmail(),
                "criadoEm", u.getCriadoEm().toString()
        ));
        result.put("tenant", Map.of(
                "nome", u.getTenant().getNome(),
                "plano", u.getTenant().getPlano().name(),
                "criadoEm", u.getTenant().getCriadoEm().toString()
        ));
        result.put("totalExperimentos", experimentos.size());
        result.put("experimentos", experimentos);
        result.put("totalFormulacoes", formulacoes.size());
        result.put("formulacoes", formulacoes);
        return result;
    }

    private static String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        int at = email.indexOf('@');
        return email.charAt(0) + "***" + email.substring(at);
    }

    @Transactional
    public String esqueciSenha(Map<String, String> body) {
        try {
            String email = body.get("email");
            log.info("=== esqueci-senha: {}", maskEmail(email));
            usuarioRepository.findByEmail(email).ifPresent(u -> {
                if (u.getSenhaHash().equals("OAUTH2_NO_PASSWORD")) return;
                passwordResetRepo.deleteByUsuarioId(u.getId());
                PasswordResetToken prt = new PasswordResetToken();
                prt.setId(UUID.randomUUID().toString());
                prt.setToken(UUID.randomUUID().toString());
                prt.setUsuario(u);
                prt.setExpiraEm(LocalDateTime.now().plusHours(1));
                passwordResetRepo.save(prt);
                emailService.enviarRecuperacaoSenha(email, prt.getToken());
            });
            return "Se o email estiver cadastrado, você receberá as instruções em breve.";
        } catch (Exception e) {
            log.error("=== esqueci-senha erro: {}", e.getMessage(), e);
            throw e;
        }
    }
}
