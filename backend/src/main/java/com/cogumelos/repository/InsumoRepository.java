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

package com.cogumelos.repository;

import com.cogumelos.domain.Insumo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface InsumoRepository extends JpaRepository<Insumo, String> {

    List<Insumo> findByTenantIdOrderByCategoriaAsc(Long tenantId);

    List<Insumo> findByCategoriaAndTenantId(String categoria, Long tenantId);

    Optional<Insumo> findByIdAndTenantId(String id, Long tenantId);
}