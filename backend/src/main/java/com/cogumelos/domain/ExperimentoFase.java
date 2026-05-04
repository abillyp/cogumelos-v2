package com.cogumelos.domain;


import com.cogumelos.enums.Fase;
import com.cogumelos.enums.StatusFormulacao;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "experimento_fase")
@Getter
@Setter
public class ExperimentoFase{

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "experimento_fase_seq")
    @SequenceGenerator(name = "experimento_fase_seq", sequenceName = "experimento_fase_id_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "experimento_id", nullable = false)
    private Experimento experimento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Fase fase = Fase.PREPARACAO;

    @Column(name = "inicio")
    private LocalDate inicio;

    @Column(name = "fim")
    private LocalDate fim;

    @Column(name = "ciclo")
    private Integer ciclo;
}
