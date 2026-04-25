/*
 * Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
 * Todos os direitos reservados.
 *
 * Este arquivo é parte do sistema cogumelos.app e está protegido pela
 * Lei Brasileira de Direitos Autorais (Lei nº 9.610/1998).
 * Uso, cópia ou distribuição não autorizados são expressamente proibidos.
 *
 * Contato: alessandro.palma@organico4you.com.br
 */

package com.cogumelos.repository;

import com.cogumelos.domain.FormulacaoInsumo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FormulacaoInsumoRepository extends JpaRepository<FormulacaoInsumo, String> {

    List<FormulacaoInsumo> findByFormulacaoIdAndTenantId(String formulacaoId, Long tenantId);

    Optional<FormulacaoInsumo> findByIdAndTenantId(String id, Long tenantId);
}