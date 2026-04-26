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

import com.cogumelos.domain.ExperimentoCusto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ExperimentoCustoRepository extends JpaRepository<ExperimentoCusto, String> {

    List<ExperimentoCusto> findByExperimentoIdAndTenantId(String experimentoId, Long tenantId);

    Optional<ExperimentoCusto> findByIdAndTenantId(String id, Long tenantId);

    @Modifying
    @Query("DELETE FROM ExperimentoCusto e WHERE e.experimento.id = :experimentoId AND e.tenantId = :tenantId")
    void deleteByExperimentoIdAndTenantId(@Param("experimentoId") String experimentoId,
                                          @Param("tenantId") Long tenantId);
}