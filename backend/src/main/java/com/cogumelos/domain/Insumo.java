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

package com.cogumelos.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "insumos")
@Data
@NoArgsConstructor
public class Insumo extends TenantEntity{

    @Id
    private String id;

    @NotBlank
    @Column(nullable = false, unique = true)
    private String nome;

    @NotNull @DecimalMin("0.0") @DecimalMax("1.0")
    @Column(name = "mo_pct", nullable = false)
    private Double moPct;

    @NotNull @DecimalMin("0.0") @DecimalMax("1.0")
    @Column(name = "carbono_pct", nullable = false)
    private Double carbonoPct;

    @NotNull @DecimalMin("0.0") @DecimalMax("1.0")
    @Column(name = "nitrogenio_pct", nullable = false)
    private Double nitrogenioPct;

    @Column(name = "cn_ratio")
    private Double cnRatio;

    @DecimalMin("0.0") @DecimalMax("14.0")
    private Double ph;

    private String categoria;

    @PrePersist @PreUpdate
    public void calcularCnRatio() {
        if (nitrogenioPct != null && nitrogenioPct > 0)
            this.cnRatio = carbonoPct / nitrogenioPct;
    }
}
