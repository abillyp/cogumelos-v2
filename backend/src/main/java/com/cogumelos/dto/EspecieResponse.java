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

package com.cogumelos.dto;

import com.cogumelos.domain.EspecieCogumelo;

public record EspecieResponse(String id, String nome, Double cnMin, Double cnMax, String notas) {
    public static EspecieResponse from(EspecieCogumelo e) {
        return new EspecieResponse(e.getId(), e.getNome(), e.getCnMin(), e.getCnMax(), e.getNotas());
    }
}