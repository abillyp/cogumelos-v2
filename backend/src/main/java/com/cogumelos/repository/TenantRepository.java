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

package com.cogumelos.repository;

import com.cogumelos.domain.Tenant;
import com.cogumelos.enums.StatusTenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TenantRepository extends JpaRepository<Tenant, Long> {
    boolean existsByEmail(String email);
    Optional<Tenant> findByEmail(String email);

    /**
     * Retorna tenants EXPIRADO ou CANCELADO cuja data de expiração mais relevante
     * (assinaturaExpira, ou trialExpira como fallback) é anterior ao limite.
     * Usado pela rotina de purge de dados (LGPD — retenção máxima de dados).
     */
    @Query("""
        SELECT t FROM Tenant t
        WHERE t.status IN :statuses
        AND t.email != 'sistema@cogumelos.app'
        AND (
            (t.assinaturaExpira IS NOT NULL AND t.assinaturaExpira < :limite)
            OR (t.assinaturaExpira IS NULL AND t.trialExpira IS NOT NULL AND t.trialExpira < :limite)
        )
    """)
    List<Tenant> findExpiradosParaPurge(@Param("statuses") List<StatusTenant> statuses,
                                        @Param("limite") LocalDate limite);
}