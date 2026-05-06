package com.cogumelos.service;

import com.cogumelos.domain.RefreshToken;
import com.cogumelos.domain.Usuario;
import com.cogumelos.repository.RefreshTokenRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class AuthService {

    private final RefreshTokenRepository refreshRepo;
    private final JwtService jwtService;

    public AuthService(RefreshTokenRepository refreshRepo, JwtService jwtService) {
        this.refreshRepo = refreshRepo;
        this.jwtService = jwtService;
    }

    @Transactional
    public void logout(String rt) {
        refreshRepo.findByToken(rt).ifPresent(t -> { t.setUsado(true); refreshRepo.save(t); });
    }

    @Transactional
    public Map<String, Object> refresh(String rt, int refreshHours) {
        RefreshToken token = refreshRepo.findByToken(rt)
                .orElseThrow(() -> new RuntimeException("Refresh token inválido"));

        // ✅ detecção de reuso — token já usado = possível roubo
        if (token.isUsado()) {
            // invalida TODOS os refresh tokens do usuário
            refreshRepo.deleteAllByUsuarioId(token.getUsuario().getId());
            log.warn("=== REUSO DE REFRESH TOKEN DETECTADO — usuário: {} — todos os tokens invalidados",
                    token.getUsuario().getEmail());
            throw new RuntimeException("Sessão inválida. Faça login novamente.");
        }
        if (token.isExpirado())
            throw new RuntimeException("Refresh token expirado");
        token.setUsado(true);
        refreshRepo.save(token);
        return buildLoginResponse(token.getUsuario(), refreshHours);
    }

    public Usuario extractUserFromToken(String rt) {
        RefreshToken token = refreshRepo.findByToken(rt)
                .orElseThrow(() -> new RuntimeException("Refresh token inválido"));
        return token.getUsuario();
    }

    public Map<String, Object> buildLoginResponse(Usuario u, int refreshHours) {
        String token = jwtService.gerar(
                u.getId(), u.getEmail(), u.getRole().name(),
                u.getTenant().getId(), u.getTenant().getPlano().name(),
                u.getSenhaHash().equals("OAUTH2_NO_PASSWORD") ? "GOOGLE" : "EMAIL"
        );
        RefreshToken rt = new RefreshToken();
        rt.setId(UUID.randomUUID().toString());
        rt.setToken(UUID.randomUUID().toString());
        rt.setUsuario(u);
        rt.setExpiraEm(LocalDateTime.now().plusHours(refreshHours));
        refreshRepo.save(rt);
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("refreshToken", rt.getToken());
        response.put("id", u.getId());
        response.put("nome", u.getNome());
        response.put("email", u.getEmail());
        response.put("role", u.getRole().name());
        response.put("loginType", u.getSenhaHash().equals("OAUTH2_NO_PASSWORD") ? "GOOGLE" : "EMAIL");
        return response;
    }
}
