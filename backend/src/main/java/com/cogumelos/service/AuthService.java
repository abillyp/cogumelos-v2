package com.cogumelos.service;

import com.cogumelos.domain.RefreshToken;
import com.cogumelos.domain.Usuario;
import com.cogumelos.repository.RefreshTokenRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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
    public Map<String, Object> refresh(String rt, int refresh) {

        RefreshToken token = refreshRepo.findByToken(rt)
                .orElseThrow(() -> new RuntimeException("Refresh token inválido"));
        if (!token.isValido()) throw new RuntimeException("Refresh token expirado ou já utilizado");
        token.setUsado(true);
        refreshRepo.save(token);
        return buildLoginResponse(token.getUsuario(), refresh);
    }

    public Usuario extractUserFromToken(String rt) {
        RefreshToken token = refreshRepo.findByToken(rt)
                .orElseThrow(() -> new RuntimeException("Refresh token inválido"));
        return token.getUsuario();
    }

    public Map<String, Object> buildLoginResponse(Usuario u, int refreshDays) {
        String token = jwtService.gerar(
                u.getId(), u.getEmail(), u.getRole().name(),
                u.getTenant().getId(), u.getTenant().getPlano().name(),
                u.getSenhaHash().equals("OAUTH2_NO_PASSWORD") ? "GOOGLE" : "EMAIL"
        );
        RefreshToken rt = new RefreshToken();
        rt.setId(UUID.randomUUID().toString());
        rt.setToken(UUID.randomUUID().toString());
        rt.setUsuario(u);
        rt.setExpiraEm(LocalDateTime.now().plusDays(refreshDays));
        refreshRepo.save(rt);
        return Map.of("token", token, "refreshToken", rt.getToken(),
                "id", u.getId(), "nome", u.getNome(),
                "email", u.getEmail(), "role", u.getRole().name(),
                "loginType", u.getSenhaHash().equals("OAUTH2_NO_PASSWORD") ? "GOOGLE" : "EMAIL");
    }
}
