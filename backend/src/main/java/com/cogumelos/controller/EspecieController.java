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

import com.cogumelos.service.EspecieService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/especies")
class EspecieController {

    private final EspecieService especieService;

    EspecieController(EspecieService especieService) {
        this.especieService = especieService;
    }

    @GetMapping
    public List<Dtos.EspecieResponse> listar() {
        return especieService.listar();
    }
}
