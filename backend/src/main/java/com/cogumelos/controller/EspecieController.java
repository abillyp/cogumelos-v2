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

package com.cogumelos.controller;

import com.cogumelos.dto.Dtos;
import com.cogumelos.repository.EspecieCogumeloRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/especies")
class EspecieController {

    private final EspecieCogumeloRepository repo;

    EspecieController(EspecieCogumeloRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Dtos.EspecieResponse> listar() {
        return repo.findAll().stream().map(Dtos.EspecieResponse::from).toList();
    }
}
