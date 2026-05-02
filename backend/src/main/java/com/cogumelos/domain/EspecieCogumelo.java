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

@Entity
@Table(name = "especies_cogumelo")
@Data
@NoArgsConstructor
public class EspecieCogumelo {

    @Id
    private String id;

    @NotBlank
    @Column(nullable = false, unique = true)
    private String nome;

    @NotNull @Positive
    @Column(name = "cn_min", nullable = false)
    private Double cnMin;

    @NotNull @Positive
    @Column(name = "cn_max", nullable = false)
    private Double cnMax;

    @Column(length = 1000)
    private String notas;

    public boolean cnDentroFaixa(double cn) {
        return cn >= cnMin && cn <= cnMax;
    }
}