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

import com.cogumelos.domain.Experimento;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ExperimentoRepository extends JpaRepository<Experimento, String> {

    // ✅ listagem geral do tenant
    List<Experimento> findByTenantIdOrderByDataPreparoDesc(Long tenantId);

    // ✅ busca por id com isolamento
    Optional<Experimento> findByIdAndTenantId(String id, Long tenantId);

    // ✅ busca por usuário dentro do tenant
    List<Experimento> findByUsuarioIdAndTenantId(String usuarioId, Long tenantId);

    // ✅ contagem por tenant
    long countByTenantId(Long tenantId);

    // ✅ código único por tenant (não global)
    boolean existsByCodigoAndTenantId(String codigo, Long tenantId);

    boolean existsByFormulacaoId(String id);
}