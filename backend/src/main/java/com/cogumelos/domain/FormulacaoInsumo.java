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

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.domain.Persistable;

@Entity
@Table(name = "formulacao_insumos")
@Getter
@Setter
@NoArgsConstructor
public class FormulacaoInsumo extends TenantEntity implements Persistable<String> {

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

    @ManyToOne(optional = false)
    @JoinColumn(name = "formulacao_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_formulacao_insumos_formulacao"))
    private Formulacao formulacao;

    @ManyToOne(optional = false)
    @JoinColumn(name = "insumo_id", nullable = false)
    private Insumo insumo;

    @NotNull @Positive
    @Column(name = "peso_real_kg", nullable = false)
    private Double pesoRealKg;

    @NotNull @DecimalMin("0.0") @DecimalMax("1.0")
    @Column(name = "umidade_pct", nullable = false)
    private Double umidadePct;

    @Column(name = "peso_seco_kg")
    private Double pesoSecoKg;

    @Column(name = "ms_pct")
    private Double msPct;

    @Column(name = "mo_kg")
    private Double moKg;

    @Column(name = "c_kg")
    private Double cKg;

    @Column(name = "n_kg")
    private Double nKg;

    @PrePersist
    @PreUpdate
    public void calcular() {
        this.pesoSecoKg = pesoRealKg * (1.0 - umidadePct);
        this.msPct = 1.0 - umidadePct;
        if (insumo != null) {
            this.moKg = pesoSecoKg * insumo.getMoPct();
            this.cKg  = this.moKg * insumo.getCarbonoPct();
            this.nKg  = this.moKg * insumo.getNitrogenioPct();
        }
    }

}
