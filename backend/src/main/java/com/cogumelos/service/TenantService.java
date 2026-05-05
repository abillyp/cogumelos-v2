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

import com.cogumelos.domain.Insumo;
import com.cogumelos.domain.Tenant;
import com.cogumelos.domain.Usuario;
import com.cogumelos.dto.AtualizarTenantRequest;
import com.cogumelos.dto.CriarTenantRequest;
import com.cogumelos.dto.Dtos;
import com.cogumelos.dto.TenantAdminResponse;
import com.cogumelos.enums.PlanoType;
import com.cogumelos.enums.Role;
import com.cogumelos.enums.StatusTenant;
import com.cogumelos.repository.ExperimentoRepository;
import com.cogumelos.repository.InsumoRepository;
import com.cogumelos.repository.TenantRepository;
import com.cogumelos.repository.UsuarioRepository;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Operações que envolvem o ciclo de vida de um Tenant.
 */
@Slf4j
@Service
public class TenantService {

    private static final String SISTEMA_EMAIL = "sistema@cogumelos.app";
    private static final long QUATORZE = 14;

    private final UsuarioService  usuarioService;
    private final TenantRepository tenantRepo;
    private final InsumoRepository insumoRepo;
    private final UsuarioRepository usuarioRepository;
    private final AuthService  authService;
    private final ExperimentoRepository  experimentoRepo;


    public TenantService(TenantRepository tenantRepo, InsumoRepository insumoRepo, UsuarioRepository repo, BCryptPasswordEncoder encoder, UsuarioService usuarioService, AuthService authService, ExperimentoRepository experimentoRepo) {
        this.tenantRepo = tenantRepo;
        this.insumoRepo = insumoRepo;
        this.usuarioRepository = repo;
        this.usuarioService = usuarioService;
        this.authService = authService;
        this.experimentoRepo = experimentoRepo;
    }

    /**
     * Copia os insumos do catálogo padrão (tenant "sistema") para o novo tenant.
     * Chamado sempre que um novo tenant é criado.
     */
    @Transactional
    public void inicializarTenant(Tenant novoTenant) {
        tenantRepo.findByEmail(SISTEMA_EMAIL).ifPresent(sistema -> {
            List<Insumo> catalogo = insumoRepo.findByTenantIdOrderByCategoriaAsc(sistema.getId());
            if (catalogo.isEmpty()) return;

            List<Insumo> copias = catalogo.stream().map(original -> {
                Insumo copia = new Insumo();
                copia.setId(UUID.randomUUID().toString());
                copia.setTenantId(novoTenant.getId());
                copia.setNome(original.getNome());
                copia.setMoPct(original.getMoPct());
                copia.setCarbonoPct(original.getCarbonoPct());
                copia.setNitrogenioPct(original.getNitrogenioPct());
                copia.setPh(original.getPh());
                copia.setCategoria(original.getCategoria());
                return copia;
            }).toList();

            insumoRepo.saveAll(copias);
            log.info("TenantService: {} insumos copiados para tenant '{}'.",
                    copias.size(), novoTenant.getNome());
        });
    }

    public List<Dtos.UsuarioResponse> listar(Long idTenant) {
        return usuarioRepository.findByTenantId(idTenant)
                .stream().map(Dtos.UsuarioResponse::from).toList();
    }

    @Transactional
    public ResponseEntity<?> registro(Dtos.RegistroRequest req, int refreshDays) {
        if (usuarioRepository.existsByEmail(req.email()))
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
            inicializarTenant(tenant);
            Dtos.UsuarioResponse usuarioResponse = usuarioService.criar(req, Role.ADMIN_TENANT);
            Usuario usuario = Dtos.UsuarioResponse.to(usuarioResponse);

            return ResponseEntity.status(201).body(authService.buildLoginResponse(usuario, refreshDays ));
        } catch (Exception e) {
            log.error("Erro no registro: {}", e.getMessage(), e);
            throw e;
        }
    }

    public TenantAdminResponse criar(CriarTenantRequest req) {
        if (tenantRepo.existsByEmail(req.email()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email do tenant já cadastrado");
        if (usuarioRepository.existsByEmail(req.emailAdmin()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email do admin já cadastrado");

        Tenant t = new Tenant();
        t.setNome(req.nome());
        t.setEmail(req.email());
        t.setPlano(req.plano());
        t.setStatus(req.plano() == PlanoType.BASICO || req.plano() == PlanoType.PRO
                ? StatusTenant.ATIVO : StatusTenant.TRIAL);
        t.setTrialExpira(LocalDate.now().plusDays(QUATORZE));
        tenantRepo.save(t);

        Dtos.RegistroRequest registroRequest = new Dtos.RegistroRequest(req.nome(), req.nomeAdmin(), req.email(), req.senhaAdmin());

        Dtos.UsuarioResponse usuarioResponse = usuarioService.criar(registroRequest, Role.ADMIN_TENANT);

        Usuario admin = Dtos.UsuarioResponse.to(usuarioResponse);

        return TenantAdminResponse.from(t, admin, 0L, 1L);
    }

    public List<TenantAdminResponse> listar() {
        return tenantRepo.findAll().stream()
                .filter(t -> !t.getEmail().equals("sistema@cogumelos.app"))
                .map(t -> {
                    Usuario admin = usuarioRepository.findByTenantId(t.getId())
                            .stream()
                            .filter(u -> u.getRole().name().contains("ADMIN"))
                            .findFirst()
                            .orElse(null);
                    long exps    = experimentoRepo.countByTenantId(t.getId());
                    long users   = usuarioRepository.findByTenantId(t.getId()).size();
                    return TenantAdminResponse.from(t, admin, exps, users);
                })
                .toList();
    }

    public TenantAdminResponse buscar(Long id) {
        Tenant t = tenantRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant não encontrado"));
        Usuario admin = usuarioRepository.findByTenantId(t.getId())
                .stream().filter(u -> u.getRole().name().contains("ADMIN"))
                .findFirst().orElse(null);
        long exps  = experimentoRepo.countByTenantId(t.getId());
        long users = usuarioRepository.findByTenantId(t.getId()).size();
        return TenantAdminResponse.from(t, admin, exps, users);
    }

    public TenantAdminResponse atualizar( Long id, AtualizarTenantRequest req) {
        Tenant t = tenantRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant não encontrado"));

        if (req.nome() != null && !req.nome().isBlank()) t.setNome(req.nome());
        t.setPlano(req.plano());
        t.setStatus(req.status());
        t.setTrialExpira(req.trialExpira());
        t.setAssinaturaExpira(req.assinaturaExpira());
        tenantRepo.save(t);

        Usuario admin = usuarioRepository.findByTenantId(t.getId())
                .stream().filter(u -> u.getRole().name().contains("ADMIN"))
                .findFirst().orElse(null);
        return TenantAdminResponse.from(t, admin,
                experimentoRepo.countByTenantId(t.getId()),
                usuarioRepository.findByTenantId(t.getId()).size());
    }

    public TenantAdminResponse estenderTrial( Long id, java.util.Map<String, Integer> body) {
        int dias = body.getOrDefault("dias", 14);
        Tenant t = tenantRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant não encontrado"));

        LocalDate base = t.getTrialExpira() != null && t.getTrialExpira().isAfter(LocalDate.now())
                ? t.getTrialExpira() : LocalDate.now();
        t.setTrialExpira(base.plusDays(dias));
        t.setStatus(StatusTenant.TRIAL);
        tenantRepo.save(t);

        Usuario admin = usuarioRepository.findByTenantId(t.getId())
                .stream().filter(u -> u.getRole().name().contains("ADMIN"))
                .findFirst().orElse(null);
        return TenantAdminResponse.from(t, admin,
                experimentoRepo.countByTenantId(t.getId()),
                usuarioRepository.findByTenantId(t.getId()).size());
    }

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