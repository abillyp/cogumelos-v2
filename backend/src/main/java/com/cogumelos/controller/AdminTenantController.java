package com.cogumelos.controller;

import com.cogumelos.domain.Tenant;
import com.cogumelos.domain.Usuario;
import com.cogumelos.dto.AtualizarTenantRequest;
import com.cogumelos.dto.TenantAdminResponse;
import com.cogumelos.dto.CriarTenantRequest;
import com.cogumelos.enums.PlanoType;
import com.cogumelos.enums.StatusTenant;
import com.cogumelos.repository.ExperimentoRepository;
import com.cogumelos.repository.TenantRepository;
import com.cogumelos.repository.UsuarioRepository;
import com.cogumelos.service.TenantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/tenants")
@Tag(name = "Admin — Tenants", description = "Gestão de tenants pelo administrador global. Requer role ADMIN.")
public class AdminTenantController {

    private final TenantRepository    tenantRepo;
    private final TenantService       tenantService;
    private final UsuarioRepository   usuarioRepo;
    private final ExperimentoRepository experimentoRepo;
    private final BCryptPasswordEncoder encoder;

    public AdminTenantController(TenantRepository tenantRepo, TenantService tenantService,
                                 UsuarioRepository usuarioRepo,
                                 ExperimentoRepository experimentoRepo,
                                 BCryptPasswordEncoder encoder) {
        this.tenantRepo      = tenantRepo;
        this.tenantService = tenantService;
        this.usuarioRepo     = usuarioRepo;
        this.experimentoRepo = experimentoRepo;
        this.encoder         = encoder;
    }


    @Operation(summary = "Listar todos os tenants",
        description = "Retorna todos os tenants com métricas de uso. Requer role ADMIN.")
    @GetMapping
    public List<TenantAdminResponse> listar() {
        return tenantService.listar();
    }

    @Operation(summary = "Buscar tenant por ID")
    @GetMapping("/{id}")
    public TenantAdminResponse buscar(@PathVariable Long id) {
        return tenantService.buscar(id);
    }

    @Operation(summary = "Atualizar plano, status e datas de expiração do tenant")
    @PatchMapping("/{id}")
    public TenantAdminResponse atualizar(@PathVariable Long id,
                                         @Valid @RequestBody AtualizarTenantRequest req) {
        return tenantService.atualizar(id, req);
    }

    @Operation(summary = "Estender trial do tenant em N dias")
    @PostMapping("/{id}/estender-trial")
    public TenantAdminResponse estenderTrial(@PathVariable Long id,
                                              @RequestBody java.util.Map<String, Integer> body) {
        return tenantService.estenderTrial(id, body);
    }

    @Operation(summary = "Criar novo tenant manualmente")
    @PostMapping
    public ResponseEntity<TenantAdminResponse> criar(@Valid @RequestBody CriarTenantRequest req) {
        return ResponseEntity.status(201).body(tenantService.criar(req));
    }

    @Operation(summary = "Resumo geral para o dashboard admin")
    @GetMapping("/resumo")
    public java.util.Map<String, Object> resumo() {
        return tenantService.resumo();
    }

//    @Operation(summary = "Lista todos os usuários de um tenant")
//    @GetMapping("{tenantId}/usuarios")
//    public java.util.Collection<Usuario> usuarios(@PathVariable("tenantId") String tenantId) {
//
//    }
}
