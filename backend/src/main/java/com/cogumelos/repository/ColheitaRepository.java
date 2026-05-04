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

import com.cogumelos.domain.Colheita;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ColheitaRepository extends JpaRepository<Colheita, String> {

    // ✅ sempre filtra por tenant
    List<Colheita> findByTenantId(Long tenantId);

    // ✅ busca colheitas de um experimento dentro do tenant
    List<Colheita> findByExperimentoIdAndTenantId(String experimentoId, Long tenantId);

    // ✅ busca por id garantindo isolamento
    Optional<Colheita> findByIdAndTenantId(String id, Long tenantId);

    int countByExperimentoIdAndTenantId(String experimentoId, Long tenantId);
}