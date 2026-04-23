/*
 * Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
 * Todos os direitos reservados.
 *
 * Este arquivo é parte do sistema cogumelos.app e está protegido pela
 * Lei Brasileira de Direitos Autorais (Lei nº 9.610/1998).
 * Uso, cópia ou distribuição não autorizados são expressamente proibidos.
 *
 * Contato: contato@cogumelos.app
 */

package com.cogumelos.domain;

import com.cogumelos.enums.StatusSala;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "experimentos")
@NoArgsConstructor
@Data
public class Experimento extends TenantEntity {

    @Id
    private String id;

    @NotNull
    @ManyToOne(optional = false, fetch = FetchType.LAZY) // LAZY aqui
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @NotNull
    @ManyToOne(optional = false, fetch = FetchType.LAZY) // LAZY aqui
    @JoinColumn(name = "formulacao_id", nullable = false)
    private Formulacao formulacao;

    @NotBlank
    @Column(nullable = false, unique = true)
    private String codigo;

    @NotNull
    @Column(name = "data_preparo", nullable = false)
    private LocalDate dataPreparo;

    @Column(name = "data_inoculacao")
    private LocalDate dataInoculacao;

    @Column(name = "amadurecimento_inicio")
    private LocalDate amadurecimentoInicio;

    @Column(name = "amadurecimento_fim")
    private LocalDate amadurecimentoFim;

    @Column(name = "frutificacao_inicio")
    private LocalDate frutificacaoInicio;

    @Column(name = "frutificacao_fim")
    private LocalDate frutificacaoFim;

    @NotNull @Positive
    @Column(name = "total_blocos", nullable = false)
    private Integer totalBlocos;

    @Positive
    @Column(name = "peso_bloco_kg")
    private Double pesoBlocoKg;

    @Positive
    @Column(name = "preco_venda_kg")
    private Double precoVendaKg;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusSala status = StatusSala.PREPARACAO;

    @OneToMany(mappedBy = "experimento", cascade = CascadeType.ALL,
            orphanRemoval = true, fetch = FetchType.LAZY) // LAZY aqui
    private List<LoteMonitoramento> monitoramentos = new ArrayList<>();

    @OneToMany(mappedBy = "experimento", cascade = CascadeType.ALL,
            orphanRemoval = true, fetch = FetchType.LAZY) // LAZY aqui
    private List<Colheita> colheitas = new ArrayList<>();

    @OneToMany(mappedBy = "experimento", cascade = CascadeType.ALL,
            orphanRemoval = true, fetch = FetchType.LAZY) // LAZY aqui
    private List<ExperimentoCusto> custos = new ArrayList<>();


    public void setCustos(List<ExperimentoCusto> custos) {
        this.custos.clear();
        if (custos != null) {
            custos.forEach(this::addCusto);
        }
    }

    public void addCusto(ExperimentoCusto custo) {
        this.custos.add(custo);
        custo.setExperimento(this);
    }
}