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
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "colheitas")
@Data
@NoArgsConstructor
public class Colheita extends TenantEntity{

    @Id
    private String id;

    @NotNull
    @ManyToOne(optional = false)
    @JoinColumn(name = "experimento_id", nullable = false)
    private Experimento experimento;

    @NotNull
    @Column(nullable = false)
    private LocalDate data;

    @NotNull @Positive
    @Column(name = "peso_total_kg", nullable = false)
    private Double pesoTotalKg;

    @Column(name = "media_por_bloco_kg")
    private Double mediaPorBlocoKg;

    @Column(length = 500)
    private String notas;

    @PrePersist
    @PreUpdate
    public void calcularMedia() {
        if (experimento != null && experimento.getTotalBlocos() != null
                && experimento.getTotalBlocos() > 0 && pesoTotalKg != null) {
            this.mediaPorBlocoKg = pesoTotalKg / experimento.getTotalBlocos();
        }
    }
}
