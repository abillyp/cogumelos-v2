package com.cogumelos.controller;

import com.cogumelos.domain.*;
import com.cogumelos.dto.Dtos.*;
import com.cogumelos.enums.PlanoType;
import com.cogumelos.enums.Role;
import com.cogumelos.repository.*;
import com.cogumelos.service.JwtService;
import com.cogumelos.service.EmailService;
import com.cogumelos.service.TenantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Autenticação", description = "Login, registro, refresh token e logout")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final UsuarioRepository usuarioRepo;
    private final TenantRepository tenantRepo;
    private final RefreshTokenRepository refreshRepo;
    private final BCryptPasswordEncoder encoder;
    private final JwtService jwtService;
    private final TenantService tenantService;
    private final PasswordResetTokenRepository passwordResetRepo;
    private final EmailService emailService;

    @Value("${jwt.refresh-expiration-days:30}")
    private int refreshDays;

    public AuthController(UsuarioRepository usuarioRepo,
                          TenantRepository tenantRepo,
                          RefreshTokenRepository refreshRepo,
                          BCryptPasswordEncoder encoder,
                          JwtService jwtService,
                          TenantService tenantService, PasswordResetTokenRepository passwordResetRepo, EmailService emailService) {
        this.usuarioRepo   = usuarioRepo;
        this.tenantRepo    = tenantRepo;
        this.refreshRepo   = refreshRepo;
        this.encoder       = encoder;
        this.jwtService    = jwtService;
        this.tenantService = tenantService;
        this.passwordResetRepo = passwordResetRepo;
        this.emailService = emailService;
    }

    @Operation(summary = "Login com email e senha",
        description = "Autentica o usuário e retorna JWT de acesso (15 min) e refresh token (30 dias).")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Login realizado com sucesso"),
        @ApiResponse(responseCode = "400", description = "Email ou senha inválidos",
            content = @Content(examples = @ExampleObject(value = "{\"erro\": \"Email ou senha inválidos\"}")))
    })
    @PostMapping("/login")
    @Transactional
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        Usuario u = usuarioRepo.findByEmail(req.email())
                .orElseThrow(() -> new RuntimeException("Email ou senha inválidos"));
        if (!u.isAtivo()) throw new RuntimeException("Usuário inativo. Contate o administrador.");
        if (!encoder.matches(req.senha(), u.getSenhaHash()))
            throw new RuntimeException("Email ou senha inválidos");
        return ResponseEntity.ok(buildLoginResponse(u));
    }

    @Operation(summary = "Registro de novo produtor",
        description = "Cria tenant com trial de 14 dias e retorna JWT de acesso.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Conta criada com sucesso"),
        @ApiResponse(responseCode = "400", description = "Email já cadastrado ou dados inválidos")
    })
    @PostMapping("/registro")
    @Transactional
    public ResponseEntity<?> registro(@Valid @RequestBody RegistroRequest req) {
        if (usuarioRepo.existsByEmail(req.email()))
            throw new RuntimeException("Email já cadastrado");
        try {
            // Cria o tenant com trial de 14 dias
            Tenant tenant = new Tenant();
            tenant.setNome(req.nomeProdutor());
            tenant.setEmail(req.email());
            tenant.setPlano(PlanoType.BASICO);
            tenant.setStatus(com.cogumelos.enums.StatusTenant.TRIAL);
            tenant.setTrialExpira(java.time.LocalDate.now().plusDays(14));
            tenantRepo.save(tenant);

            // Copia insumos do catálogo padrão
            tenantService.inicializarTenant(tenant);

            // Cria o usuário ADMIN_TENANT
            Usuario u = new Usuario();
            u.setId(UUID.randomUUID().toString());
            u.setNome(req.nome());
            u.setEmail(req.email());
            u.setSenhaHash(encoder.encode(req.senha()));
            u.setRole(Role.ADMIN_TENANT);
            u.setTenant(tenant);
            usuarioRepo.save(u);

            return ResponseEntity.status(201).body(buildLoginResponse(u));
        } catch (Exception e) {
            log.error("Erro no registro: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Operation(summary = "Renovar token de acesso",
        description = "Troca refresh token válido por novo par de tokens.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Tokens renovados"),
        @ApiResponse(responseCode = "400", description = "Refresh token inválido ou expirado")
    })
    @PostMapping("/refresh")
    @Transactional
    public ResponseEntity<?> refresh(@RequestBody Map<String, String> body) {
        String rt = body.get("refreshToken");
        RefreshToken token = refreshRepo.findByToken(rt)
                .orElseThrow(() -> new RuntimeException("Refresh token inválido"));
        if (!token.isValido()) throw new RuntimeException("Refresh token expirado ou já utilizado");
        token.setUsado(true);
        refreshRepo.save(token);
        return ResponseEntity.ok(buildLoginResponse(token.getUsuario()));
    }

    @Operation(summary = "Logout", description = "Invalida o refresh token informado.")
    @PostMapping("/logout")
    @Transactional
    public ResponseEntity<Void> logout(@RequestBody Map<String, String> body) {
        String rt = body.get("refreshToken");
        refreshRepo.findByToken(rt).ifPresent(t -> { t.setUsado(true); refreshRepo.save(t); });
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Solicitar recuperação de senha")
    @PostMapping("/esqueci-senha")
    @Transactional
    public ResponseEntity<?> esqueciSenha(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            log.info("=== esqueci-senha: {}", email);
            usuarioRepo.findByEmail(email).ifPresent(u -> {
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
            return ResponseEntity.ok(Map.of("mensagem", "Se o email estiver cadastrado, você receberá as instruções em breve."));
        } catch (Exception e) {
            log.error("=== esqueci-senha erro: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Operation(summary = "Redefinir senha com token")
    @PostMapping("/redefinir-senha")
    @Transactional
    public ResponseEntity<?> redefinirSenha(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String novaSenha = body.get("novaSenha");

        PasswordResetToken prt = passwordResetRepo.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Token inválido"));

        if (!prt.isValido()) throw new RuntimeException("Token expirado ou já utilizado");

        Usuario u = prt.getUsuario();
        u.setSenhaHash(encoder.encode(novaSenha));
        usuarioRepo.save(u);

        prt.setUsado(true);
        passwordResetRepo.save(prt);

        return ResponseEntity.ok(Map.of("mensagem", "Senha redefinida com sucesso."));
    }

    @Operation(summary = "Alterar senha autenticado")
    @PatchMapping("/alterar-senha")
    @Transactional
    public ResponseEntity<?> alterarSenha(
            @RequestBody Map<String, String> body,
            org.springframework.security.core.Authentication auth) {

        String userId = (String) auth.getPrincipal();
        Usuario u = usuarioRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        if (u.getSenhaHash().equals("OAUTH2_NO_PASSWORD"))
            throw new RuntimeException("Usuários Google não podem alterar senha por aqui.");

        if (!encoder.matches(body.get("senhaAtual"), u.getSenhaHash()))
            throw new RuntimeException("Senha atual incorreta.");

        u.setSenhaHash(encoder.encode(body.get("novaSenha")));
        usuarioRepo.save(u);

        return ResponseEntity.ok(Map.of("mensagem", "Senha alterada com sucesso."));
    }

    @Operation(summary = "Dados do usuário logado")
    @ApiResponse(responseCode = "200", description = "Dados do usuário autenticado")
    @GetMapping("/me")
    public ResponseEntity<?> me(org.springframework.security.core.Authentication auth) {
        String userId = (String) auth.getPrincipal();
        Usuario u = usuarioRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        return ResponseEntity.ok(Map.of(
                "id", u.getId(), "nome", u.getNome(),
                "email", u.getEmail(), "role", u.getRole().name()
        ));
    }

    private Map<String, Object> buildLoginResponse(Usuario u) {
        String token = jwtService.gerar(
                u.getId(), u.getEmail(), u.getRole().name(),
                u.getTenant().getId(), u.getTenant().getPlano().name(),
                u.getSenhaHash().equals("OAUTH2_NO_PASSWORD") ? "GOOGLE" : "EMAIL"
        );
        RefreshToken rt = new RefreshToken();
        rt.setId(UUID.randomUUID().toString());
        rt.setToken(UUID.randomUUID().toString());
        rt.setUsuario(u);
        rt.setExpiraEm(LocalDateTime.now().plusDays(refreshDays));
        refreshRepo.save(rt);
        return Map.of("token", token, "refreshToken", rt.getToken(),
                "id", u.getId(), "nome", u.getNome(),
                "email", u.getEmail(), "role", u.getRole().name(),
                "loginType", u.getSenhaHash().equals("OAUTH2_NO_PASSWORD") ? "GOOGLE" : "EMAIL");
    }
}
