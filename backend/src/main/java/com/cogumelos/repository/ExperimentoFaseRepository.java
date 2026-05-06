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

package com.cogumelos.repository;

import com.cogumelos.domain.Experimento;
import com.cogumelos.domain.ExperimentoFase;
import com.cogumelos.enums.Fase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ExperimentoFaseRepository extends JpaRepository<ExperimentoFase, Integer> {

    @Query(" SELECT ef FROM ExperimentoFase ef WHERE ef.experimento = :experimento AND ef.fase = :fase AND ef.ciclo = ( SELECT MAX(ef2.ciclo) FROM ExperimentoFase ef2 WHERE ef2.experimento = :experimento)")
    Optional<ExperimentoFase> findFaseComMaiorCiclo(@Param("experimento") Experimento experimento,@Param("fase") Fase faseAtual);
}
