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

package com.cogumelos.domain;

import com.cogumelos.enums.StatusFormulacao;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "formulacoes")
@Data
@NoArgsConstructor
public class Formulacao extends TenantEntity{

    @Id
    private String id;

    @NotNull
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @NotNull
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "especie_id", nullable = false)
    private EspecieCogumelo especie;

    @NotBlank
    @Column(nullable = false)
    private String nome;

    @Column(name = "cn_total")
    private Double cnTotal;

    @Column(name = "ph_medio")
    private Double phMedio;

    @Column(name = "criado_em", nullable = false)
    private LocalDate criadoEm = LocalDate.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusFormulacao status = StatusFormulacao.RASCUNHO;

    @OneToMany(mappedBy = "formulacao", cascade = CascadeType.ALL,
               orphanRemoval = true, fetch = FetchType.LAZY)
    private List<FormulacaoInsumo> insumos = new ArrayList<>();


    public void recalcular() {
        double totalC = 0, totalN = 0, somaPh = 0;
        int countPh = 0;
        for (FormulacaoInsumo fi : insumos) {
            totalC += fi.getCKg() != null ? fi.getCKg() : 0;
            totalN += fi.getNKg() != null ? fi.getNKg() : 0;
            if (fi.getInsumo().getPh() != null) {
                somaPh += fi.getInsumo().getPh();
                countPh++;
            }
        }
        this.cnTotal = totalN > 0 ? totalC / totalN : null;
        this.phMedio = countPh > 0 ? somaPh / countPh : null;
    }

    public boolean cnDentroFaixa() {
        return cnTotal != null && especie != null && especie.cnDentroFaixa(cnTotal);
    }

}
