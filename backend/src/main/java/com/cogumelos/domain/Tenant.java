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

import com.cogumelos.enums.PlanoType;
import com.cogumelos.enums.StatusTenant;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tenants")
@Data
@NoArgsConstructor
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false, unique = true)
    private String email;

    @Enumerated(EnumType.STRING)
    private PlanoType plano = PlanoType.BASICO;

    @Enumerated(EnumType.STRING)
    private StatusTenant status = StatusTenant.TRIAL;

    private LocalDate trialExpira;
    private LocalDate assinaturaExpira;

    @CreationTimestamp
    private LocalDateTime criadoEm;

}