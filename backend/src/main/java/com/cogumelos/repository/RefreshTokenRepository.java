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

import com.cogumelos.domain.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, String> {

    Optional<RefreshToken> findByToken(String token);

    List<RefreshToken> findByUsuarioId(String usuarioId);

    @Modifying
    @Query("DELETE FROM RefreshToken r WHERE r.usuario.id = :usuarioId")
    void deleteByUsuarioId(String usuarioId);

    @Modifying
    @Query("DELETE FROM RefreshToken r WHERE r.usado = true") // ✅ PostgreSQL
    void deleteUsados();
}