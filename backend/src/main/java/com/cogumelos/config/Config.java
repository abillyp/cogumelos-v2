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

package com.cogumelos.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate;
import java.util.Map;

@Converter(autoApply = false)
class LocalDateConverter implements AttributeConverter<LocalDate, String> {

    @Override
    public String convertToDatabaseColumn(LocalDate date) {
        return date != null ? date.toString() : null;
    }

    @Override
    public LocalDate convertToEntityAttribute(String value) {
        if (value == null || value.isBlank() || value.equals("n/a")) return null;
        try { return LocalDate.parse(value); } catch (Exception e) { return null; }
    }
}

@RestControllerAdvice
class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatus(ResponseStatusException ex) {
        String msg = ex.getReason() != null ? ex.getReason() : ex.getMessage();
        return ResponseEntity.status(ex.getStatusCode())
                .body(Map.of("erro", msg != null ? msg : "Erro na requisição"));
    }


    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntime(RuntimeException ex) {
        String msg = ex.getMessage();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(Map.of("erro", msg != null ? msg : "Requisição inválida"));
    }

    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(
            org.springframework.web.bind.MethodArgumentNotValidException ex) {
        String mensagem = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getDefaultMessage())
                .collect(java.util.stream.Collectors.joining(" | "));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("erro", mensagem));
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleConstraint(
            org.springframework.dao.DataIntegrityViolationException ex) {
        String msg = ex.getMessage() != null ? ex.getMessage().toLowerCase() : "";
        if (msg.contains("experimentos.codigo") || msg.contains("unique constraint failed: experimentos.codigo")) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("erro", "Já existe um experimento com este código. Escolha outro código."));
        }
        if (msg.contains("unique") || msg.contains("constraint")) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("erro", "Já existe um registro com esses dados. Verifique os campos e tente novamente."));
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(Map.of("erro", "Erro de integridade nos dados. Verifique os campos e tente novamente."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneric(Exception ex) {
        log.error("Erro interno: {}", ex.getMessage(), ex);  // já tem isso
        // adiciona print do stack trace completo
        ex.printStackTrace();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("erro", "Erro interno. Tente novamente."));
    }
}
