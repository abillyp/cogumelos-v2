package com.cogumelos.dto.formulacao;

import com.cogumelos.domain.Formulacao;

import java.util.List;

public record FormulacaoResponse(String id, String nome, String usuarioId, String usuarioNome,
                                 String especieId, String especieNome, Double cnTotal, Double phMedio, String criadoEm,
                                 String status, boolean cnDentroFaixa, List<FormulacaoInsumoResponse> insumos,
                                 Double umidadeDesejada, Double pesoBlocoKg, Integer totalBlocos) {
    public static FormulacaoResponse from(Formulacao f) {
        return new FormulacaoResponse(f.getId(), f.getNome(), f.getUsuario().getId(), f.getUsuario().getNome(),
                f.getEspecie().getId(), f.getEspecie().getNome(), f.getCnTotal(), f.getPhMedio(),
                f.getCriadoEm().toString(), f.getStatus().name(), f.cnDentroFaixa(),
                f.getInsumos().stream().map(FormulacaoInsumoResponse::from).toList(),
                f.getUmidade(), f.getPesoBlocoKg(), f.getTotalBlocos());
    }
}
