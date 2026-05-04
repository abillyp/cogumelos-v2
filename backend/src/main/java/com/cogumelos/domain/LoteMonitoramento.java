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

import com.cogumelos.enums.Sala;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "lote_monitoramentos")
@Data
@NoArgsConstructor
public class LoteMonitoramento extends TenantEntity{

    @Id
    private String id;

    @NotNull
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "experimento_id", nullable = false)
    private Experimento experimento;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Sala sala;

    @NotNull
    @Column(nullable = false)
    private LocalDate data;

    @DecimalMin("0.0") @DecimalMax("50.0")
    private Double temperatura;

    @DecimalMin("0.0") @DecimalMax("100.0")
    private Double umidade;

    @Column(length = 500)
    private String observacao;

    @Column(name = "blocos_perdidos")
    private Integer blocosPerdidos;

}
