package com.cogumelos.dto.usuario;

public record AuthResponse(String token, String refreshToken, String id, String nome, String email, String role) {}
