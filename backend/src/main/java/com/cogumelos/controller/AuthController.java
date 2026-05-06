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

package com.cogumelos.controller;

import com.cogumelos.domain.*;
import com.cogumelos.dto.usuario.LoginRequest;
import com.cogumelos.dto.usuario.RegistroRequest;
import com.cogumelos.repository.*;
import com.cogumelos.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Arrays;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Autenticação", description = "Login, registro, refresh token e logout")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final UsuarioService usuarioService;
    private final AuthService    authService;
    private final TenantService  tenantService;

    @Value("${jwt.refresh-expiration-days:1}")
    private int refreshDays;

    @Value("${jwt.refresh-expiration-hours:8}")
    private int refreshHours;

    @Value("${cookie.secure:true}")
    private boolean cookieSecure;

    public AuthController(UsuarioService usuarioService, AuthService authService,
                          TenantService tenantService) {
        this.usuarioService = usuarioService;
        this.authService    = authService;
        this.tenantService  = tenantService;
    }

    // ── Helpers de cookie ────────────────────────────────────────────────────

    private void setRefreshCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from("refreshToken", token)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/api/auth")
                .maxAge(Duration.ofDays(refreshHours))
                .sameSite("Strict")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/api/auth")
                .maxAge(0)
                .sameSite("Strict")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private String extractRefreshCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> "refreshToken".equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }

    // ── Endpoints ────────────────────────────────────────────────────────────

    @Operation(summary = "Login com email e senha",
            description = "Autentica o usuário e retorna JWT de acesso (15 min). Refresh token setado em HttpOnly cookie.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Login realizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Email ou senha inválidos",
                    content = @Content(examples = @ExampleObject(value = "{\"erro\": \"Email ou senha inválidos\"}")))
    })
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req,
                                   HttpServletResponse response) {
        log.info("=== login chamado: {}", req.email());
        Map<String, Object> data = usuarioService.login(req, refreshDays);
        setRefreshCookie(response, (String) data.get("refreshToken"));
        data.remove("refreshToken"); // não expõe no body
        return ResponseEntity.ok(data);
    }

    @Operation(summary = "Registro de novo produtor",
            description = "Cria tenant com trial de 14 dias e retorna JWT de acesso.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Conta criada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Email já cadastrado ou dados inválidos")
    })
    @PostMapping("/registro")
    public ResponseEntity<?> registro(@Valid @RequestBody RegistroRequest req,
                                      HttpServletResponse response) {
        Map<String, Object> data = tenantService.registro(req, refreshDays);
        setRefreshCookie(response, (String) data.get("refreshToken"));
        data.remove("refreshToken");
        return ResponseEntity.status(201).body(data);
    }

    @Operation(summary = "Renovar token de acesso",
            description = "Lê refresh token do HttpOnly cookie e retorna novo JWT de acesso.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Token renovado"),
            @ApiResponse(responseCode = "401", description = "Refresh token inválido, expirado ou ausente")
    })
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request,
                                     HttpServletResponse response) {
        String rt = extractRefreshCookie(request);
        if (rt == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("erro", "Refresh token ausente"));
        Map<String, Object> data = authService.refresh(rt, refreshDays);
        setRefreshCookie(response, (String) data.get("refreshToken"));
        data.remove("refreshToken");
        return ResponseEntity.ok(data);
    }

    @Operation(summary = "Logout", description = "Invalida o refresh token e limpa o cookie.")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request,
                                       HttpServletResponse response) {
        String rt = extractRefreshCookie(request);
        if (rt != null) authService.logout(rt);
        clearRefreshCookie(response);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Solicitar recuperação de senha")
    @PostMapping("/esqueci-senha")
    public ResponseEntity<?> esqueciSenha(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(usuarioService.esqueciSenha(body));
    }

    @Operation(summary = "Redefinir senha com token")
    @PostMapping("/redefinir-senha")
    public ResponseEntity<?> redefinirSenha(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(usuarioService.redefinirSenha(body));
    }

    @Operation(summary = "Alterar senha autenticado")
    @PatchMapping("/alterar-senha")
    public ResponseEntity<?> alterarSenha(
            @RequestBody Map<String, String> body,
            org.springframework.security.core.Authentication auth) {
        return ResponseEntity.ok(usuarioService.alterarSenha(
                body.get("senhaAtual"), body.get("novaSenha"), auth.getPrincipal().toString()));
    }

    @Operation(summary = "Dados do usuário logado")
    @ApiResponse(responseCode = "200", description = "Dados do usuário autenticado")
    @GetMapping("/me")
    public ResponseEntity<?> me(org.springframework.security.core.Authentication auth) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.ok(usuarioService.me(userId));
    }
}