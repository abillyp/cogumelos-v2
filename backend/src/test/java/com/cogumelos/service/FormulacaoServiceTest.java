/*
 * Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
 * Todos os direitos reservados.
 *
 * Este arquivo é parte do sistema cogumelos.app e está protegido pela
 * Lei Brasileira de Direitos Autorais (Lei nº 9.610/1998).
 * Uso, cópia ou distribuição não autorizados são expressamente proibidos.
 *
 * Contato: alessandro.palma@organico4you.com.br
 */

package com.cogumelos.service;

import com.cogumelos.domain.*;
import com.cogumelos.dto.Dtos.*;
import com.cogumelos.enums.PlanoType;
import com.cogumelos.enums.Role;
import com.cogumelos.repository.*;
import com.cogumelos.security.TenantContext;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("FormulacaoService — testes unitários")
class FormulacaoServiceTest {

    @Mock FormulacaoRepository         formulacaoRepo;
    @Mock EspecieCogumeloRepository    especieRepo;
    @Mock InsumoRepository             insumoRepo;
    @Mock UsuarioRepository            usuarioRepo;

    @InjectMocks FormulacaoService service;

    private static final Long TENANT_ID = 1L;
    private Usuario usuario;
    private EspecieCogumelo especie;
    private Insumo insumo;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT_ID);

        Tenant tenant = new Tenant();
        tenant.setId(TENANT_ID);
        tenant.setNome("Teste");
        tenant.setPlano(PlanoType.TRIAL);

        usuario = new Usuario();
        usuario.setId("user-1");
        usuario.setNome("Billy");
        usuario.setEmail("billy@test.com");
        usuario.setRole(Role.ADMIN_TENANT);
        usuario.setSenhaHash("hash");
        usuario.setTenant(tenant);

        especie = new EspecieCogumelo();
        especie.setId("esp-1");
        especie.setNome("Pleurotus ostreatus");
        especie.setCnMin(25.0);
        especie.setCnMax(40.0);

        insumo = new Insumo();
        insumo.setId("ins-1");
        insumo.setNome("Serragem");
        insumo.setMoPct(0.95);
        insumo.setCarbonoPct(0.49);
        insumo.setNitrogenioPct(0.001);
        insumo.setTenantId(TENANT_ID);
        insumo.calcularCnRatio();
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("listar() deve retornar apenas formulações do tenant atual")
    void listar_deveRetornarFormulacoesDOTenant() {
        Formulacao f = new Formulacao();
        f.setId("form-1");
        f.setNome("Shimeji A3");
        f.setTenantId(TENANT_ID);
        f.setEspecie(especie);
        f.setUsuario(usuario);

        when(formulacaoRepo.findByTenantIdOrderByCriadoEmDesc(TENANT_ID))
                .thenReturn(List.of(f));

        List<FormulacaoResponse> resultado = service.listar();

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).nome()).isEqualTo("Shimeji A3");
        verify(formulacaoRepo).findByTenantIdOrderByCriadoEmDesc(TENANT_ID);
    }

    @Test
    @DisplayName("criar() deve salvar formulação com insumos e calcular C/N")
    void criar_deveCalcularCnEPersistir() {
        FormulacaoInsumoItem item = new FormulacaoInsumoItem("ins-1", 10.0, 0.40);
        FormulacaoRequest req = new FormulacaoRequest("esp-1", "Shimeji A3", List.of(item));

        when(usuarioRepo.findById("user-1")).thenReturn(Optional.of(usuario));
        when(especieRepo.findById("esp-1")).thenReturn(Optional.of(especie));
        when(insumoRepo.findByIdAndTenantId("ins-1", TENANT_ID)).thenReturn(Optional.of(insumo));
        when(formulacaoRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        FormulacaoResponse resp = service.criar(req, "user-1");

        assertThat(resp.nome()).isEqualTo("Shimeji A3");
        assertThat(resp.especieNome()).isEqualTo("Pleurotus ostreatus");
        verify(formulacaoRepo).save(any(Formulacao.class));
    }

    @Test
    @DisplayName("criar() deve lançar 404 quando insumo não pertence ao tenant")
    void criar_insumoDeOutroTenant_deveLancar404() {
        FormulacaoInsumoItem item = new FormulacaoInsumoItem("ins-outro-tenant", 10.0, 0.40);
        FormulacaoRequest req = new FormulacaoRequest("esp-1", "Teste", List.of(item));

        when(usuarioRepo.findById("user-1")).thenReturn(Optional.of(usuario));
        when(especieRepo.findById("esp-1")).thenReturn(Optional.of(especie));
        when(insumoRepo.findByIdAndTenantId("ins-outro-tenant", TENANT_ID))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.criar(req, "user-1"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Insumo não encontrado");
    }

    @Test
    @DisplayName("buscar() deve lançar 404 para formulação de outro tenant")
    void buscar_formulacaoDeOutroTenant_deveLancar404() {
        when(formulacaoRepo.findByIdAndTenantId("form-outro", TENANT_ID))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.buscar("form-outro"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Formulação não encontrada");
    }

    @Test
    @DisplayName("deletar() deve confirmar tenant antes de excluir")
    void deletar_deveConfirmarTenantAntesDeExcluir() {
        Formulacao f = new Formulacao();
        f.setId("form-1");
        f.setTenantId(TENANT_ID);
        f.setEspecie(especie);
        f.setUsuario(usuario);

        when(formulacaoRepo.findByIdAndTenantId("form-1", TENANT_ID))
                .thenReturn(Optional.of(f));

        service.deletar("form-1");

        verify(formulacaoRepo).deleteById("form-1");
    }
}
