package com.cogumelos.service;

import com.cogumelos.domain.Insumo;
import com.cogumelos.dto.Dtos;
import com.cogumelos.repository.InsumoRepository;
import com.cogumelos.security.TenantContext;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class InsumoService {

    private final InsumoRepository repo;

    public InsumoService(InsumoRepository repo) {
        this.repo = repo;
    }

    public List<Dtos.InsumoResponse> listar() {
        return repo.findByTenantIdOrderByCategoriaAsc(TenantContext.getTenantId())
                .stream().map(Dtos.InsumoResponse::from).toList();
    }

    public List<String> categorias() {
        return repo.findByTenantIdOrderByCategoriaAsc(TenantContext.getTenantId())
                .stream().map(Insumo::getCategoria)
                .filter(Objects::nonNull).distinct().sorted().toList();
    }

    public Dtos.InsumoResponse criar(Dtos.InsumoRequest req) {
        Insumo i = new Insumo();
        i.setId(UUID.randomUUID().toString());
        i.setTenantId(TenantContext.getTenantId());
        i.setNome(req.nome());
        i.setMoPct(req.moPct());
        i.setCarbonoPct(req.carbonoPct());
        i.setNitrogenioPct(req.nitrogenioPct());
        i.setPh(req.ph());
        i.setCategoria(req.categoria());
        return Dtos.InsumoResponse.from(repo.save(i));
    }

    public Dtos.InsumoResponse atualizar(
            String id,
            Dtos.InsumoRequest req) {
        Insumo i = repo.findByIdAndTenantId(id, TenantContext.getTenantId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Insumo não encontrado"));
        i.setNome(req.nome()); i.setMoPct(req.moPct());
        i.setCarbonoPct(req.carbonoPct()); i.setNitrogenioPct(req.nitrogenioPct());
        i.setPh(req.ph()); i.setCategoria(req.categoria());
        return Dtos.InsumoResponse.from(repo.save(i));
    }

    public void deletar(
            @Parameter(description = "ID do insumo") @PathVariable String id) {
        repo.findByIdAndTenantId(id, TenantContext.getTenantId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Insumo não encontrado"));
        repo.deleteById(id);
    }
}
