package com.cogumelos.controller;

import com.cogumelos.domain.Tenant;
import com.cogumelos.domain.Usuario;
import com.cogumelos.enums.PlanoType;
import com.cogumelos.enums.StatusTenant;
import com.cogumelos.repository.ExperimentoRepository;
import com.cogumelos.repository.TenantRepository;
import com.cogumelos.repository.UsuarioRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/tenants")
@Tag(name = "Admin — Tenants", description = "Gestão de tenants pelo administrador global. Requer role ADMIN.")
public class AdminTenantController {

    private final TenantRepository    tenantRepo;
    private final UsuarioRepository   usuarioRepo;
    private final ExperimentoRepository experimentoRepo;
    private final BCryptPasswordEncoder encoder;

    public AdminTenantController(TenantRepository tenantRepo,
                                 UsuarioRepository usuarioRepo,
                                 ExperimentoRepository experimentoRepo,
                                 BCryptPasswordEncoder encoder) {
        this.tenantRepo      = tenantRepo;
        this.usuarioRepo     = usuarioRepo;
        this.experimentoRepo = experimentoRepo;
        this.encoder         = encoder;
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────

    public record TenantAdminResponse(
            Long id, String nome, String email,
            String plano, String status,
            LocalDate trialExpira, LocalDate assinaturaExpira,
            LocalDateTime criadoEm,
            String usuarioAdminNome, String usuarioAdminEmail,
            long totalExperimentos, long totalUsuarios
    ) {
        public static TenantAdminResponse from(Tenant t, Usuario admin,
                                               long experimentos, long usuarios) {
            return new TenantAdminResponse(
                    t.getId(), t.getNome(), t.getEmail(),
                    t.getPlano().name(), t.getStatus().name(),
                    t.getTrialExpira(), t.getAssinaturaExpira(),
                    t.getCriadoEm(),
                    admin != null ? admin.getNome() : "—",
                    admin != null ? admin.getEmail() : "—",
                    experimentos, usuarios
            );
        }
    }

    public record AtualizarTenantRequest(
            String nome,
            @NotNull PlanoType plano,
            @NotNull StatusTenant status,
            LocalDate trialExpira,
            LocalDate assinaturaExpira
    ) {}

    public record CriarTenantRequest(
            @NotBlank String nome,
            @NotBlank @Email String email,
            @NotBlank String nomeAdmin,
            @NotBlank String emailAdmin,
            @NotBlank String senhaAdmin,
            @NotNull PlanoType plano
    ) {}

    // ── Endpoints ─────────────────────────────────────────────────────────────

    @Operation(summary = "Listar todos os tenants",
        description = "Retorna todos os tenants com métricas de uso. Requer role ADMIN.")
    @GetMapping
    public List<TenantAdminResponse> listar() {
        return tenantRepo.findAll().stream()
                .filter(t -> !t.getEmail().equals("sistema@cogumelos.app"))
                .map(t -> {
                    Usuario admin = usuarioRepo.findByTenantId(t.getId())
                            .stream()
                            .filter(u -> u.getRole().name().contains("ADMIN"))
                            .findFirst()
                            .orElse(null);
                    long exps    = experimentoRepo.countByTenantId(t.getId());
                    long users   = usuarioRepo.findByTenantId(t.getId()).size();
                    return TenantAdminResponse.from(t, admin, exps, users);
                })
                .toList();
    }

    @Operation(summary = "Buscar tenant por ID")
    @GetMapping("/{id}")
    public TenantAdminResponse buscar(@PathVariable Long id) {
        Tenant t = tenantRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant não encontrado"));
        Usuario admin = usuarioRepo.findByTenantId(t.getId())
                .stream().filter(u -> u.getRole().name().contains("ADMIN"))
                .findFirst().orElse(null);
        long exps  = experimentoRepo.countByTenantId(t.getId());
        long users = usuarioRepo.findByTenantId(t.getId()).size();
        return TenantAdminResponse.from(t, admin, exps, users);
    }

    @Operation(summary = "Atualizar plano, status e datas de expiração do tenant")
    @PatchMapping("/{id}")
    public TenantAdminResponse atualizar(@PathVariable Long id,
                                         @Valid @RequestBody AtualizarTenantRequest req) {
        Tenant t = tenantRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant não encontrado"));

        if (req.nome() != null && !req.nome().isBlank()) t.setNome(req.nome());
        t.setPlano(req.plano());
        t.setStatus(req.status());
        t.setTrialExpira(req.trialExpira());
        t.setAssinaturaExpira(req.assinaturaExpira());
        tenantRepo.save(t);

        Usuario admin = usuarioRepo.findByTenantId(t.getId())
                .stream().filter(u -> u.getRole().name().contains("ADMIN"))
                .findFirst().orElse(null);
        return TenantAdminResponse.from(t, admin,
                experimentoRepo.countByTenantId(t.getId()),
                usuarioRepo.findByTenantId(t.getId()).size());
    }

    @Operation(summary = "Estender trial do tenant em N dias")
    @PostMapping("/{id}/estender-trial")
    public TenantAdminResponse estenderTrial(@PathVariable Long id,
                                              @RequestBody java.util.Map<String, Integer> body) {
        int dias = body.getOrDefault("dias", 14);
        Tenant t = tenantRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant não encontrado"));

        LocalDate base = t.getTrialExpira() != null && t.getTrialExpira().isAfter(LocalDate.now())
                ? t.getTrialExpira() : LocalDate.now();
        t.setTrialExpira(base.plusDays(dias));
        t.setStatus(StatusTenant.TRIAL);
        tenantRepo.save(t);

        Usuario admin = usuarioRepo.findByTenantId(t.getId())
                .stream().filter(u -> u.getRole().name().contains("ADMIN"))
                .findFirst().orElse(null);
        return TenantAdminResponse.from(t, admin,
                experimentoRepo.countByTenantId(t.getId()),
                usuarioRepo.findByTenantId(t.getId()).size());
    }

    @Operation(summary = "Criar novo tenant manualmente")
    @PostMapping
    public ResponseEntity<TenantAdminResponse> criar(@Valid @RequestBody CriarTenantRequest req) {
        if (tenantRepo.existsByEmail(req.email()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email do tenant já cadastrado");
        if (usuarioRepo.existsByEmail(req.emailAdmin()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email do admin já cadastrado");

        Tenant t = new Tenant();
        t.setNome(req.nome());
        t.setEmail(req.email());
        t.setPlano(req.plano());
        t.setStatus(req.plano() == PlanoType.BASICO || req.plano() == PlanoType.PRO
                ? StatusTenant.ATIVO : StatusTenant.TRIAL);
        t.setTrialExpira(LocalDate.now().plusDays(14));
        tenantRepo.save(t);

        Usuario admin = new Usuario();
        admin.setId(UUID.randomUUID().toString());
        admin.setNome(req.nomeAdmin());
        admin.setEmail(req.emailAdmin());
        admin.setSenhaHash(encoder.encode(req.senhaAdmin()));
        admin.setRole(com.cogumelos.enums.Role.ADMIN_TENANT);
        admin.setTenant(t);
        usuarioRepo.save(admin);

        return ResponseEntity.status(201).body(
                TenantAdminResponse.from(t, admin, 0L, 1L));
    }

    @Operation(summary = "Resumo geral para o dashboard admin")
    @GetMapping("/resumo")
    public java.util.Map<String, Object> resumo() {
        List<Tenant> todos = tenantRepo.findAll().stream()
                .filter(t -> !t.getEmail().equals("sistema@cogumelos.app"))
                .toList();
        long total      = todos.size();
        long emTrial    = todos.stream().filter(t -> t.getStatus() == StatusTenant.TRIAL).count();
        long ativos     = todos.stream().filter(t -> t.getStatus() == StatusTenant.ATIVO).count();
        long expirados  = todos.stream().filter(t -> t.getStatus() == StatusTenant.EXPIRADO
                || t.getStatus() == StatusTenant.CANCELADO).count();
        long expira3dias = todos.stream().filter(t -> t.getStatus() == StatusTenant.TRIAL
                && t.getTrialExpira() != null
                && !t.getTrialExpira().isBefore(LocalDate.now())
                && t.getTrialExpira().isBefore(LocalDate.now().plusDays(4))).count();
        return java.util.Map.of(
                "total", total, "emTrial", emTrial, "ativos", ativos,
                "expirados", expirados, "expira3dias", expira3dias
        );
    }
}
