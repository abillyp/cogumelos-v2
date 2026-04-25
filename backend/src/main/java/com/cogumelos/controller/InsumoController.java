package com.cogumelos.controller;

import com.cogumelos.domain.Insumo;
import com.cogumelos.dto.Dtos.*;
import com.cogumelos.repository.InsumoRepository;
import com.cogumelos.security.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Insumos", description = "Catálogo de materiais para formulação de substrato. POST/PUT/DELETE requer role ADMIN.")
public class InsumoController {

    private final InsumoRepository repo;

    InsumoController(InsumoRepository repo) { this.repo = repo; }

    @Operation(summary = "Listar insumos do tenant",
        description = "Retorna os insumos disponíveis para o tenant, ordenados por categoria.")
    @GetMapping
    public List<InsumoResponse> listar() {
        return repo.findByTenantIdOrderByCategoriaAsc(TenantContext.getTenantId())
                .stream().map(InsumoResponse::from).toList();
    }

    @Operation(summary = "Listar categorias de insumos")
    @GetMapping("/categorias")
    public List<String> categorias() {
        return repo.findByTenantIdOrderByCategoriaAsc(TenantContext.getTenantId())
                .stream().map(Insumo::getCategoria)
                .filter(Objects::nonNull).distinct().sorted().toList();
    }

    @Operation(summary = "Criar insumo", description = "Cria um novo insumo no catálogo do tenant. Requer role ADMIN.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Insumo criado"),
        @ApiResponse(responseCode = "403", description = "Sem permissão — requer ADMIN")
    })
    @PostMapping
    public ResponseEntity<InsumoResponse> criar(@Valid @RequestBody InsumoRequest req) {
        Insumo i = new Insumo();
        i.setId(UUID.randomUUID().toString());
        i.setTenantId(TenantContext.getTenantId());
        i.setNome(req.nome());
        i.setMoPct(req.moPct());
        i.setCarbonoPct(req.carbonoPct());
        i.setNitrogenioPct(req.nitrogenioPct());
        i.setPh(req.ph());
        i.setCategoria(req.categoria());
        return ResponseEntity.status(201).body(InsumoResponse.from(repo.save(i)));
    }

    @Operation(summary = "Atualizar insumo", description = "Atualiza os dados de um insumo. Requer role ADMIN.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Insumo atualizado"),
        @ApiResponse(responseCode = "404", description = "Insumo não encontrado"),
        @ApiResponse(responseCode = "403", description = "Sem permissão — requer ADMIN")
    })
    @PutMapping("/{id}")
    public InsumoResponse atualizar(
            @Parameter(description = "ID do insumo") @PathVariable String id,
            @Valid @RequestBody InsumoRequest req) {
        Insumo i = repo.findByIdAndTenantId(id, TenantContext.getTenantId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Insumo não encontrado"));
        i.setNome(req.nome()); i.setMoPct(req.moPct());
        i.setCarbonoPct(req.carbonoPct()); i.setNitrogenioPct(req.nitrogenioPct());
        i.setPh(req.ph()); i.setCategoria(req.categoria());
        return InsumoResponse.from(repo.save(i));
    }

    @Operation(summary = "Remover insumo", description = "Remove um insumo do catálogo. Requer role ADMIN.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Insumo removido"),
        @ApiResponse(responseCode = "404", description = "Insumo não encontrado")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(
            @Parameter(description = "ID do insumo") @PathVariable String id) {
        repo.findByIdAndTenantId(id, TenantContext.getTenantId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Insumo não encontrado"));
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
