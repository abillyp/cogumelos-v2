/*
 * Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
 * Todos os direitos reservados.
 *
 * Este arquivo é parte do sistema cogumelos.app e está protegido pela
 * Lei Brasileira de Direitos Autorais (Lei nº 9.610/1998).
 * Uso, cópia ou distribuição não autorizados são expressamente proibidos.
 *
 * Contato: contato@cogumelos.app
 */

package com.cogumelos.service;

import com.cogumelos.domain.Insumo;
import com.cogumelos.domain.Tenant;
import com.cogumelos.repository.InsumoRepository;
import com.cogumelos.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Operações que envolvem o ciclo de vida de um Tenant.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TenantService {

    private static final String SISTEMA_EMAIL = "sistema@cogumelos.app";

    private final TenantRepository tenantRepo;
    private final InsumoRepository insumoRepo;

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
}