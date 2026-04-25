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

package com.cogumelos.controller;

import com.cogumelos.domain.Insumo;
import com.cogumelos.dto.Dtos.*;
import com.cogumelos.repository.InsumoRepository;
import com.cogumelos.security.TenantContext;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

@RestController
@RequestMapping("/api/insumos")
public class InsumoController {

    private final InsumoRepository repo;

    InsumoController(InsumoRepository repo) { this.repo = repo; }

    @GetMapping
    public List<InsumoResponse> listar() {
        // ✅ filtra por tenant
        return repo.findByTenantIdOrderByCategoriaAsc(TenantContext.getTenantId())
                .stream().map(InsumoResponse::from).toList();
    }

    @GetMapping("/categorias")
    public List<String> categorias() {
        return repo.findByTenantIdOrderByCategoriaAsc(TenantContext.getTenantId())
                .stream()
                .map(Insumo::getCategoria)
                .filter(Objects::nonNull)
                .distinct().sorted().toList();
    }

    @PostMapping
    public ResponseEntity<InsumoResponse> criar(@Valid @RequestBody InsumoRequest req) {
        Insumo i = new Insumo();
        i.setId(UUID.randomUUID().toString());
        i.setTenantId(TenantContext.getTenantId()); // ✅ injeta tenant
        i.setNome(req.nome());
        i.setMoPct(req.moPct());
        i.setCarbonoPct(req.carbonoPct());
        i.setNitrogenioPct(req.nitrogenioPct());
        i.setPh(req.ph());
        i.setCategoria(req.categoria());
        return ResponseEntity.status(201).body(InsumoResponse.from(repo.save(i)));
    }

    @PutMapping("/{id}")
    public InsumoResponse atualizar(@PathVariable String id,
                                    @Valid @RequestBody InsumoRequest req) {
        Insumo i = repo.findByIdAndTenantId(id, TenantContext.getTenantId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Insumo não encontrado"));

        i.setNome(req.nome());
        i.setMoPct(req.moPct());
        i.setCarbonoPct(req.carbonoPct());
        i.setNitrogenioPct(req.nitrogenioPct());
        i.setPh(req.ph());
        i.setCategoria(req.categoria());
        return InsumoResponse.from(repo.save(i));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable String id) {
        repo.findByIdAndTenantId(id, TenantContext.getTenantId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Insumo não encontrado"));

        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}