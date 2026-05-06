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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.domain.Persistable;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "formulacoes")
@Getter
@Setter
@NoArgsConstructor
public class Formulacao extends TenantEntity implements Persistable<String> {

    @Id
    private String id;

    @Transient
    private boolean isNew = true;

    @Override
    public boolean isNew() {
        return isNew;
    }

    @PostLoad
    @PostPersist
    void markNotNew() {
        this.isNew = false;
    }

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_formulacoes_usuario"))
    private Usuario usuario;

    @NotNull(message = "especie não pode ser nulo")
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "especie_id", nullable = false)
    private EspecieCogumelo especie;

    @NotBlank(message = "nome não pode ser vazio")
    @Column(nullable = false)
    private String nome;

    @NotNull @DecimalMin("0.0") @DecimalMax("100")
    @Column(nullable = false)
    private Double umidade;

    @NotNull @DecimalMin("0.1")
    @Column(nullable = false)
    private Double pesoBlocoKg;

    @NotNull @DecimalMin("0.0")
    @Column(nullable = false)
    private Integer totalBlocos;

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
