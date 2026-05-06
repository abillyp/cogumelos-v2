package com.cogumelos.dto.usuario;

import com.cogumelos.domain.Usuario;
import com.cogumelos.enums.Role;

import java.time.LocalDate;

public record UsuarioResponse(String id, String nome, String email, String role, boolean ativo, String criadoEm, String senhaHash) {
    public static UsuarioResponse from(Usuario u) {
        return new UsuarioResponse(u.getId(), u.getNome(), u.getEmail(), u.getRole().name(), u.isAtivo(), u.getCriadoEm().toString(), u.getSenhaHash());
    }
    public static Usuario to(UsuarioResponse u) {
        Usuario usuario= new Usuario();
        usuario.setId(u.id());
        usuario.setNome(u.nome());
        usuario.setEmail(u.email());
        usuario.setRole(Role.valueOf(u.role()));
        usuario.setAtivo(u.ativo());
        usuario.setCriadoEm(LocalDate.parse(u.criadoEm()));
        usuario.setSenhaHash(u.senhaHash());
        return usuario;
    }

}