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
import com.cogumelos.dto.CriarTenantRequest;
import com.cogumelos.dto.Dtos;
import com.cogumelos.dto.TenantAdminResponse;
import com.cogumelos.enums.PlanoType;
import com.cogumelos.enums.Role;
import com.cogumelos.enums.StatusTenant;
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


    public TenantService(TenantRepository tenantRepo, InsumoRepository insumoRepo, UsuarioRepository repo, BCryptPasswordEncoder encoder, UsuarioService usuarioService, AuthService authService) {
        this.tenantRepo = tenantRepo;
        this.insumoRepo = insumoRepo;
        this.usuarioRepository = repo;
        this.usuarioService = usuarioService;
        this.authService = authService;
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

    public ResponseEntity<TenantAdminResponse> criar(CriarTenantRequest req) {
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

        /*
         @NotBlank String nome,
            @NotBlank String nomeProdutor,  // ← novo
            @Email @NotBlank String email,
            @NotBlank String senha
    ) {}
         */

   /*     Usuario admin = new Usuario();
        admin.setId(UUID.randomUUID().toString());
        admin.setNome(req.nomeAdmin());
        admin.setEmail(req.emailAdmin());
        admin.setSenhaHash(encoder.encode(req.senhaAdmin()));
        admin.setRole(com.cogumelos.enums.Role.ADMIN_TENANT);
        admin.setTenant(t);
        usuarioRepo.save(admin);*/

        Dtos.UsuarioResponse usuarioResponse = usuarioService.criar(registroRequest, Role.ADMIN_TENANT);

        Usuario admin = Dtos.UsuarioResponse.to(usuarioResponse);

        return ResponseEntity.status(201).body(
                TenantAdminResponse.from(t, admin, 0L, 1L));
    }




}