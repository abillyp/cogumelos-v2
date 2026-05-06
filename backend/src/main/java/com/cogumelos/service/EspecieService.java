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

package com.cogumelos.service;

import com.cogumelos.dto.EspecieResponse;
import com.cogumelos.repository.EspecieCogumeloRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EspecieService {

    private final EspecieCogumeloRepository repo;

    public EspecieService(EspecieCogumeloRepository repo) {
        this.repo = repo;
    }

    public List<EspecieResponse> listar() {
        return repo.findAll().stream().map(EspecieResponse::from).toList();
    }
}
