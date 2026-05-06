package com.cogumelos.controller;

import com.cogumelos.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Autenticação", description = "Login, registro, refresh token e logout")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final UsuarioService usuarioService;
    private final AuthService  authService;
    private final TenantService tenantService;

    @Value("${jwt.refresh-expiration-days:1}")
    private int refreshDays;

    public AuthController(UsuarioService usuarioService, AuthService authService,
                          TenantService tenantService) {
        this.usuarioService = usuarioService;
        this.authService = authService;
        this.tenantService = tenantService;
    }

    @Operation(summary = "Login com email e senha",
        description = "Autentica o usuário e retorna JWT de acesso (15 min) e refresh token (30 dias).")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Login realizado com sucesso"),
        @ApiResponse(responseCode = "400", description = "Email ou senha inválidos",
            content = @Content(examples = @ExampleObject(value = "{\"erro\": \"Email ou senha inválidos\"}")))
    })
    @PostMapping("/login")

    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req,
                                   HttpServletRequest httpRequest) {
        return ResponseEntity.ok(usuarioService.login(req, refreshDays));

    }

    @Operation(summary = "Registro de novo produtor",
        description = "Cria tenant com trial de 14 dias e retorna JWT de acesso.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Conta criada com sucesso"),
        @ApiResponse(responseCode = "400", description = "Email já cadastrado ou dados inválidos")
    })
    @PostMapping("/registro")
    public ResponseEntity<?> registro(@Valid @RequestBody RegistroRequest req) {
        return ResponseEntity.status(201).body(tenantService.registro(req, refreshDays));
    }

    @Operation(summary = "Renovar token de acesso",
        description = "Troca refresh token válido por novo par de tokens.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Tokens renovados"),
        @ApiResponse(responseCode = "400", description = "Refresh token inválido ou expirado")
    })
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody Map<String, String> body) {
        String rt = body.get("refreshToken");
        return ResponseEntity.ok(authService.refresh(rt, refreshDays));
    }

    @Operation(summary = "Logout", description = "Invalida o refresh token informado.")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody Map<String, String> body) {
        String rt = body.get("refreshToken");
        authService.logout(rt);
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
        return ResponseEntity.ok(usuarioService.alterarSenha(body.get("senhaAtual"), body.get("novaSenha"), auth.getPrincipal().toString()));
    }

    @Operation(summary = "Dados do usuário logado")
    @ApiResponse(responseCode = "200", description = "Dados do usuário autenticado")
    @GetMapping("/me")
    public ResponseEntity<?> me(org.springframework.security.core.Authentication auth) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.ok(usuarioService.me(userId));
    }


}
