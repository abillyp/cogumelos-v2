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

import com.cogumelos.domain.LoteMonitoramento;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LoteMonitoramentoRepository extends JpaRepository<LoteMonitoramento, String> {

    List<LoteMonitoramento> findByExperimentoIdAndTenantIdOrderByDataDesc(
            String experimentoId, Long tenantId);

    Optional<LoteMonitoramento> findByIdAndTenantId(String id, Long tenantId);
}