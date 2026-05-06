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

import com.cogumelos.service.ExperimentoService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/relatorio")
public class RelatorioController {

    private final ExperimentoService service;

    public RelatorioController(ExperimentoService service) {
        this.service = service;
    }

    @GetMapping
    public RelatorioResponse gerar() {
        return service.gerarRelatorio(); // ✅ sem userId/isAdmin
    }
}
