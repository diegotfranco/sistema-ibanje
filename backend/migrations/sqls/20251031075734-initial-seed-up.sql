-- =============================
-- ROLES
-- =============================
INSERT INTO roles (name, description, status)
VALUES
  ('Administrador', 'Acesso irrestrito a todas as funcionalidades do sistema para manutenção.', 'ativo'),
  ('Presidente', 'Acesso total para gestão administrativa, financeira e de pautas.', 'ativo'),
  ('Vice-Presidente', 'Acesso total para gestão, atuando como substituto legal do presidente.', 'ativo'),
  ('Secretário Responsável', 'Gestão completa de atas e membros, incluindo remoção de registros.', 'ativo'),
  ('Secretário', 'Gestão de atas e membros, sem permissão para remover registros.', 'ativo'),
  ('Tesoureiro Responsável', 'Gestão financeira completa, incluindo remoção de lançamentos.', 'ativo'),
  ('Tesoureiro', 'Gestão financeira do dia-a-dia, sem permissão para remover lançamentos.', 'ativo'),
  ('Membro', 'Acesso de visualização para transparência de atas e dados pessoais.', 'ativo');

-- =============================
-- PERMISSIONS
-- =============================
INSERT INTO permissions (name, description, status)
VALUES
  ('Acessar', 'Permite acesso à área do sistema', 'ativo'),
  ('Cadastrar', 'Permite adicionar um registro', 'ativo'),
  ('Editar', 'Permite editar um registro', 'ativo'),
  ('Remover', 'Permite remover um registro', 'ativo'),
  ('Relatórios', 'Permite gerar relatórios', 'ativo');

-- =============================
-- MODULES
-- =============================
INSERT INTO modules (name, description, status)
VALUES
  ('Usuários', 'Gerencia os usuários do sistema', 'ativo'),
  ('Cargos', 'Gerencia os cargos e funções do sistema', 'ativo'),
  ('Permissões', 'Gerencia os tipos de permissões disponíveis', 'ativo'),
  ('Áreas', 'Gerencia as seções funcionais do sistema', 'ativo'),
  ('Status', 'Gerencia os status dos registros do sistema', 'ativo'),
  ('Membros', 'Gerencia os membros da igreja', 'ativo'),
  ('Categorias de Entradas', 'Gerencia os tipos de entradas financeiras', 'ativo'),
  ('Lançamentos de Entradas', 'Gerencia o registro de entradas financeiras', 'ativo'),
  ('Categorias de Saídas', 'Gerencia os tipos de saídas financeiras', 'ativo'),
  ('Lançamentos de Saídas', 'Gerencia o registro de saídas financeiras', 'ativo'),
  ('Formas de Pagamento', 'Gerencia as formas de pagamento disponíveis', 'ativo'),
  ('Caixa', 'Gerencia os fundos e saldos da igreja', 'ativo'),
  ('Painel', 'Painel com informações e estatísticas do sistema', 'ativo'),
  ('Relatórios', 'Área destinada à geração de relatórios financeiros e administrativos', 'ativo'),
  ('Pautas', 'Gerencia as pautas das reuniões da diretoria', 'ativo'),
  ('Atas', 'Gerencia as atas das reuniões da diretoria', 'ativo');

-- =============================
-- USERS
-- =============================
-- Plaintext passwords:
--   Administrador ........... admin123
--   Presidente .............. presidente123
--   Vice Presidente ......... vicepres123
--   Tesoureiro Responsável .. tesresp123
--   Tesoureiro .............. tesoureiro123
--   Secretário Responsável .. secresp123
--   Secretário .............. secretario123
--   Membro .................. membro123
INSERT INTO users (name, email, password_hash, role_id, status)
VALUES
  ('Administrador da Silva', 'admin@email.com', 'scrypt$N=16384$r=8$p=5$keylen=64$8a601f44075d44ba2d5c1f34ed61c4aea7369849f0faa75f8689a3efef5809d8$ef12faedc65ff7b436206d446f2f70744481c12f36a441526b42cbe29e1f8bd0d54ba3439e5f1905963752ab2e2accf6cd67fceca254568203820b977cc0fb4c', (SELECT id FROM roles WHERE name = 'Administrador'), 'ativo'),
  ('Presidente da Silva', 'presidente@email.com', 'scrypt$N=16384$r=8$p=5$keylen=64$71ee3b47211c524e3808db09c0c3a33de46fb65d0475255859f5c97fb5eb9c0a$6d96cdd50fbdf138c177220f8da4e853bb0171aa708348a761f55da53d535bc834fb52a58f81e7e43fcb217d91f945c713fc677252277e2801ad7e1454f5d12a', (SELECT id FROM roles WHERE name = 'Presidente'), 'ativo'),
  ('Vice Presidente da Silva', 'vice.presidente@email.com', 'scrypt$N=16384$r=8$p=5$keylen=64$6abb837ed5f01d015f2ff6a9e0f5c5b44b8b11c6d4d48ca0f29d48f031d18c9a$0f154ca0d115604c4849a3fdcf7eccec5f2c211a5298e9b95de49399a3cf36ddac028601189f98cbb24c45c354cb2459ee42fec5846987cec190a710258ed9e7', (SELECT id FROM roles WHERE name = 'Vice-Presidente'), 'ativo'),
  ('Tesoureiro Responsável da Silva', 'tesoureiro.resp@email.com', 'scrypt$N=16384$r=8$p=5$keylen=64$3c9d159bae381310436974874e153ca23dca7b482f65a20208900f632454fe51$cdd2cd5731a35db6bbc821d81cd9a5a2b67ae90cdcba910ea77b27edd19ef34c0aef636217a6cd4183a5b07d6f7c2b8371343dab5cff83a23c953334a6ac8b26', (SELECT id FROM roles WHERE name = 'Tesoureiro Responsável'), 'ativo'),
  ('Tesoureiro da Silva', 'tesoureiro@email.com', 'scrypt$N=16384$r=8$p=5$keylen=64$80b58c49e66060a9dfb45127fc41c144122a2bd2cb2eb9cb8a93d60a20d232f3$59ffc9e5093cb595f5ea5f82b0744aea8c8fc282fb90c76f617329184c7e52d4f362371689054e3a0470dea9c2f7f560d34b66372c91bf8dcdec58782151100d', (SELECT id FROM roles WHERE name = 'Tesoureiro'), 'ativo'),
  ('Secretário Responsável da Silva', 'secretario.resp@email.com', 'scrypt$N=16384$r=8$p=5$keylen=64$f119f4a242c40a70971e2ed8795e83d8ea7e6c6f782d5b6b27ecd76739117937$dc73f612d1b45efeffe1a879239d3e941ab13834f35ea82b74fed9f90c44a505d584c89741a13d5e16220fec75c16e292c7d94eef770cbe6c2f31b1f9dfead09', (SELECT id FROM roles WHERE name = 'Secretário Responsável'), 'ativo'),
  ('Secretário da Silva', 'secretario@email.com', 'scrypt$N=16384$r=8$p=5$keylen=64$b502dddb6a70d7a8114bc5904473c4a8b9740340bdb8fec849d9b76d50b247f6$74ea5bce7b7442eaf0093e8488e4b12376dbf1e566a3786e6739affac56e82674a30bc960c573c9b533f692d15ee3d41bbc3c03b63829a5edebd71f030368889', (SELECT id FROM roles WHERE name = 'Secretário'), 'ativo'),
  ('Membro da Silva', 'membro@email.com', 'scrypt$N=16384$r=8$p=5$keylen=64$cf1951c6a335f5a1352a420e965ade6262b7169bd6ccadb00f4dac9d7bbdbf73$5720b82973425629ef2eb4579b40386e1254d3c356582478947dd467d65a960adcfd90f63681f81b4eba4d505c6c833d0a7b7ff6c782900f48b22053e0d3831d', (SELECT id FROM roles WHERE name = 'Membro'), 'ativo');

-- =============================
-- ROLE-MODULE-PERMISSIONS
-- =============================

-- Administrador: Acesso total a todos os módulos
INSERT INTO role_module_permissions (role_id, module_id, permission_id)
SELECT (SELECT id FROM roles WHERE name = 'Administrador'), m.id, p.id FROM modules m CROSS JOIN permissions p;

-- Tesoureiro: Permissões de escrita nos módulos financeiros
INSERT INTO role_module_permissions (role_id, module_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'Tesoureiro'), 
  (SELECT id FROM modules WHERE name = m.name), 
  (SELECT id FROM permissions WHERE name = p.name)
FROM (VALUES ('Painel'), ('Categorias de Entradas'), ('Lançamentos de Entradas'), ('Categorias de Saídas'), ('Lançamentos de Saídas'), ('Formas de Pagamento'), ('Caixa')) AS m(name)
CROSS JOIN (VALUES ('Acessar'), ('Cadastrar'), ('Editar'), ('Relatórios')) AS p(name);

-- Tesoureiro: Permissões de visualização nos módulos administrativos
INSERT INTO role_module_permissions (role_id, module_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'Tesoureiro'), 
  (SELECT id FROM modules WHERE name = m.name), 
  (SELECT id FROM permissions WHERE name = p.name)
FROM (VALUES ('Membros'), ('Atas')) AS m(name)
CROSS JOIN (VALUES ('Acessar'), ('Relatórios')) AS p(name);

-- Tesoureiro Responsável: Permissões de escrita TOTAL nos módulos financeiros
INSERT INTO role_module_permissions (role_id, module_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'Tesoureiro Responsável'), 
  (SELECT id FROM modules WHERE name = m.name), 
  (SELECT id FROM permissions WHERE name = p.name)
FROM (VALUES ('Painel'), ('Categorias de Entradas'), ('Lançamentos de Entradas'), ('Categorias de Saídas'), ('Lançamentos de Saídas'), ('Formas de Pagamento'), ('Caixa')) AS m(name)
CROSS JOIN (VALUES ('Acessar'), ('Cadastrar'), ('Editar'), ('Remover'), ('Relatórios')) AS p(name);

-- Tesoureiro Responsável: Permissões de visualização nos módulos administrativos
INSERT INTO role_module_permissions (role_id, module_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'Tesoureiro Responsável'), 
  (SELECT id FROM modules WHERE name = m.name), 
  (SELECT id FROM permissions WHERE name = p.name)
FROM (VALUES ('Membros'), ('Atas')) AS m(name)
CROSS JOIN (VALUES ('Acessar'), ('Relatórios')) AS p(name);

-- Secretário: Permissões de escrita nos módulos administrativos
INSERT INTO role_module_permissions (role_id, module_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'Secretário'), 
  (SELECT id FROM modules WHERE name = m.name), 
  (SELECT id FROM permissions WHERE name = p.name)
FROM (VALUES ('Painel'), ('Membros'), ('Atas')) AS m(name)
CROSS JOIN (VALUES ('Acessar'), ('Cadastrar'), ('Editar'), ('Relatórios')) AS p(name);

-- Secretário: Permissões de visualização nos módulos financeiros
INSERT INTO role_module_permissions (role_id, module_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'Secretário'), 
  (SELECT id FROM modules WHERE name = m.name), 
  (SELECT id FROM permissions WHERE name = p.name)
FROM (VALUES ('Categorias de Entradas'), ('Lançamentos de Entradas'), ('Categorias de Saídas'), ('Lançamentos de Saídas'), ('Formas de Pagamento'), ('Caixa')) AS m(name)
CROSS JOIN (VALUES ('Acessar'), ('Relatórios')) AS p(name);

-- Secretário Responsável: Permissões de escrita TOTAL nos módulos administrativos
INSERT INTO role_module_permissions (role_id, module_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'Secretário Responsável'), 
  (SELECT id FROM modules WHERE name = m.name), 
  (SELECT id FROM permissions WHERE name = p.name)
FROM (VALUES ('Painel'), ('Membros'), ('Atas')) AS m(name)
CROSS JOIN (VALUES ('Acessar'), ('Cadastrar'), ('Editar'), ('Remover'), ('Relatórios')) AS p(name);

-- Secretário Responsável: Permissões de visualização nos módulos financeiros
INSERT INTO role_module_permissions (role_id, module_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'Secretário Responsável'), 
  (SELECT id FROM modules WHERE name = m.name), 
  (SELECT id FROM permissions WHERE name = p.name)
FROM (VALUES ('Categorias de Entradas'), ('Lançamentos de Entradas'), ('Categorias de Saídas'), ('Lançamentos de Saídas'), ('Formas de Pagamento'), ('Caixa')) AS m(name)
CROSS JOIN (VALUES ('Acessar'), ('Relatórios')) AS p(name);

-- Presidente e Vice-Presidente: Acesso TOTAL a TODOS os módulos da diretoria.
DO $$
DECLARE
  role_name TEXT;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['Presidente', 'Vice-Presidente']
  LOOP
    -- Permissões Financeiras (como Tesoureiro Responsável)
    INSERT INTO role_module_permissions (role_id, module_id, permission_id)
    SELECT 
      (SELECT id FROM roles WHERE name = role_name), 
      (SELECT id FROM modules WHERE name = m.name), 
      (SELECT id FROM permissions WHERE name = p.name)
    FROM (VALUES ('Categorias de Entradas'), ('Lançamentos de Entradas'), ('Categorias de Saídas'), ('Lançamentos de Saídas'), ('Formas de Pagamento'), ('Caixa')) AS m(name)
    CROSS JOIN (VALUES ('Acessar'), ('Cadastrar'), ('Editar'), ('Remover'), ('Relatórios')) AS p(name);

    -- Permissões Administrativas (como Secretário Responsável) + Painel
    INSERT INTO role_module_permissions (role_id, module_id, permission_id)
    SELECT 
      (SELECT id FROM roles WHERE name = role_name), 
      (SELECT id FROM modules WHERE name = m.name), 
      (SELECT id FROM permissions WHERE name = p.name)
    FROM (VALUES ('Painel'), ('Membros'), ('Atas')) AS m(name)
    CROSS JOIN (VALUES ('Acessar'), ('Cadastrar'), ('Editar'), ('Remover'), ('Relatórios')) AS p(name);

    -- Permissões de Pautas (acesso exclusivo)
    INSERT INTO role_module_permissions (role_id, module_id, permission_id)
    SELECT 
      (SELECT id FROM roles WHERE name = role_name), 
      (SELECT id FROM modules WHERE name = 'Pautas'), 
      p.id
    FROM permissions p;
  END LOOP;
END $$;

-- Membro: Acesso de visualização em Atas e no seu próprio registro em Membros.
INSERT INTO role_module_permissions (role_id, module_id, permission_id)
VALUES 
  ((SELECT id FROM roles WHERE name = 'Membro'), (SELECT id FROM modules WHERE name = 'Atas'), (SELECT id FROM permissions WHERE name = 'Acessar')),
  ((SELECT id FROM roles WHERE name = 'Membro'), (SELECT id FROM modules WHERE name = 'Membros'), (SELECT id FROM permissions WHERE name = 'Acessar'));

-- =============================
-- USER-MODULE-PERMISSIONS
-- =============================
-- Assign users their role's default permissions
INSERT INTO user_module_permissions (user_id, module_id, permission_id)
SELECT u.id, rmp.module_id, rmp.permission_id
FROM users u
JOIN roles r ON u.role_id = r.id
JOIN role_module_permissions rmp ON r.id = rmp.role_id;

-- =============================
-- PAYMENT METHODS
-- =============================
INSERT INTO payment_methods (name, allows_inflow, allows_outflow, status)
VALUES
  ('Dinheiro', true, true, 'ativo'),
  ('Transferência Bancária', true, true, 'ativo'),
  ('Cartão de Débito', true, true, 'ativo'),
  ('Cartão de Crédito', false, true, 'ativo'),
  ('Boleto Bancário', false, true, 'ativo');

-- =============================
-- INCOME CATEGORIES
-- =============================
INSERT INTO income_categories (name, status)
VALUES
  ('Dízimo', 'ativo'),
  ('Oferta', 'ativo'),
  ('Doações', 'ativo'),
  ('Missões', 'ativo'),
  ('PAM', 'ativo');

-- =============================
-- EXPENSE CATEGORIES
-- =============================
INSERT INTO expense_categories (name, status)
VALUES
  ('FGTM Pastoral', 'ativo'),
  ('Honorário Pastoral', 'ativo'),
  ('Fatura Água', 'ativo'),
  ('Fatura Energia', 'ativo'),
  ('Vigilância Patrimonial', 'ativo'),
  ('Tarifa Bancária', 'ativo');

-- =============================
-- MEMBERS
-- =============================
INSERT INTO members (name, birth_date, address_street, address_number, address_complement, address_district, state, city, postal_code, email, phone, status)
VALUES
  ('João da Silva', '1985-05-15', 'Rua das Flores', 123, 'Apto 45', 'Centro', 'SP', 'São Paulo', '01001000', 'joao.silva@email.com', '11987654321', 'ativo'),
  ('Maria Oliveira', '1992-09-23', 'Avenida Principal', 456, NULL, 'Jardins', 'RJ', 'Rio de Janeiro', '20040030', 'maria.oliveira@email.com', '21987654321', 'ativo'),
  ('Carlos Pereira', '1978-11-02', 'Travessa dos Sonhos', 78, NULL, 'Vila Madalena', 'SP', 'São Paulo', '05448000', 'carlos.pereira@email.com', '11987654321', 'inativo'),
  ('Ana Souza', '1995-02-20', 'Rua da Paz', 99, 'Casa 2', 'Lapa', 'SP', 'São Paulo', '05069000', 'ana.souza@email.com', '11912345678', 'ativo');

-- =============================
-- INCOME ENTRIES
-- =============================
INSERT INTO income_entries (reference_date, deposit_date, amount, category_id, member_id, payment_method_id, status)
VALUES
  -- August 2025
  ('2025-08-10', '2025-08-10', 550.00, (SELECT id FROM income_categories WHERE name = 'Dízimo'), (SELECT id FROM members WHERE name = 'João da Silva'), (SELECT id FROM payment_methods WHERE name = 'Transferência Bancária'), 'paga'),
  ('2025-08-10', '2025-08-10', 250.00, (SELECT id FROM income_categories WHERE name = 'Oferta'), NULL, (SELECT id FROM payment_methods WHERE name = 'Dinheiro'), 'paga'),
  -- September 2025
  ('2025-09-07', '2025-09-07', 1200.00, (SELECT id FROM income_categories WHERE name = 'Dízimo'), (SELECT id FROM members WHERE name = 'Maria Oliveira'), (SELECT id FROM payment_methods WHERE name = 'Transferência Bancária'), 'paga'),
  ('2025-09-07', '2025-09-07', 320.00, (SELECT id FROM income_categories WHERE name = 'Oferta'), NULL, (SELECT id FROM payment_methods WHERE name = 'Dinheiro'), 'paga'),
  ('2025-09-30', '2025-09-30', 200.00, (SELECT id FROM income_categories WHERE name = 'Doações'), (SELECT id FROM members WHERE name = 'João da Silva'), (SELECT id FROM payment_methods WHERE name = 'Transferência Bancária'), 'paga'),
  -- October 2025
  ('2025-10-05', '2025-10-05', 500.00, (SELECT id FROM income_categories WHERE name = 'Dízimo'), (SELECT id FROM members WHERE name = 'Ana Souza'), (SELECT id FROM payment_methods WHERE name = 'Transferência Bancária'), 'paga'),
  ('2025-10-12', '2025-10-12', 150.00, (SELECT id FROM income_categories WHERE name = 'Oferta'), NULL, (SELECT id FROM payment_methods WHERE name = 'Dinheiro'), 'paga'),
  ('2025-10-20', '2025-10-21', 1000.00, (SELECT id FROM income_categories WHERE name = 'Doações'), (SELECT id FROM members WHERE name = 'Maria Oliveira'), (SELECT id FROM payment_methods WHERE name = 'Transferência Bancária'), 'pendente'); -- Not paid, won't affect balance

-- =============================
-- EXPENSE ENTRIES
-- =============================
INSERT INTO expense_entries (reference_date, total, amount, installment, total_installments, category_id, user_id, payment_method_id, status)
VALUES
  -- August 2025
  ('2025-08-15', 260.00, 260.00, 1, 1, (SELECT id FROM expense_categories WHERE name = 'Fatura Água'), (SELECT id FROM users WHERE email = 'tesoureiro@email.com'), (SELECT id FROM payment_methods WHERE name = 'Boleto Bancário'), 'paga'),
  ('2025-08-20', 400.00, 400.00, 1, 1, (SELECT id FROM expense_categories WHERE name = 'Honorário Pastoral'), (SELECT id FROM users WHERE email = 'tesoureiro.resp@email.com'), (SELECT id FROM payment_methods WHERE name = 'Transferência Bancária'), 'paga'),
  ('2025-08-25', 360.00, 360.00, 1, 1, (SELECT id FROM expense_categories WHERE name = 'Fatura Energia'), (SELECT id FROM users WHERE email = 'tesoureiro@email.com'), (SELECT id FROM payment_methods WHERE name = 'Boleto Bancário'), 'paga'),
  -- September 2025
  ('2025-09-15', 255.00, 255.00, 1, 1, (SELECT id FROM expense_categories WHERE name = 'Fatura Água'), (SELECT id FROM users WHERE email = 'tesoureiro@email.com'), (SELECT id FROM payment_methods WHERE name = 'Boleto Bancário'), 'paga'),
  ('2025-09-20', 400.00, 400.00, 1, 1, (SELECT id FROM expense_categories WHERE name = 'Honorário Pastoral'), (SELECT id FROM users WHERE email = 'tesoureiro.resp@email.com'), (SELECT id FROM payment_methods WHERE name = 'Transferência Bancária'), 'paga'),
  ('2025-09-25', 355.00, 355.00, 1, 1, (SELECT id FROM expense_categories WHERE name = 'Fatura Energia'), (SELECT id FROM users WHERE email = 'tesoureiro@email.com'), (SELECT id FROM payment_methods WHERE name = 'Boleto Bancário'), 'paga'),
  -- October 2025
  ('2025-10-10', 250.00, 250.00, 1, 1, (SELECT id FROM expense_categories WHERE name = 'Fatura Água'), (SELECT id FROM users WHERE email = 'tesoureiro@email.com'), (SELECT id FROM payment_methods WHERE name = 'Boleto Bancário'), 'paga'),
  ('2025-10-15', 400.00, 400.00, 1, 1, (SELECT id FROM expense_categories WHERE name = 'Honorário Pastoral'), (SELECT id FROM users WHERE email = 'tesoureiro.resp@email.com'), (SELECT id FROM payment_methods WHERE name = 'Transferência Bancária'), 'paga'),
  ('2025-10-25', 350.00, 350.00, 1, 1, (SELECT id FROM expense_categories WHERE name = 'Fatura Energia'), (SELECT id FROM users WHERE email = 'tesoureiro@email.com'), (SELECT id FROM payment_methods WHERE name = 'Boleto Bancário'), 'pendente'); -- Not paid, won't affect balance

-- =============================
-- BOARD MEETINGS
-- =============================
INSERT INTO board_meetings (meeting_date, type, agenda_content, agenda_author_id, agenda_created_at)
VALUES
  -- 1: Assembleia Ordinária de Março de 2023 (Baseado na Ata 719)
  ('2023-03-12', 'ordinária', 
  '{
    "ops": [
      {"insert": "Pauta da Assembleia Ordinária\n", "attributes": {"header": 1}},
      {"insert": "1. Oração inicial\n", "attributes": {"list": "ordered"}},
      {"insert": "2. Leitura e aprovação da Ata anterior (Nº 718)\n", "attributes": {"list": "ordered"}},
      {"insert": "3. Apresentação do Relatório Financeiro (Janeiro e Fevereiro 2023)\n", "attributes": {"list": "ordered"}},
      {"insert": "4. Deliberação sobre o apoio a seminaristas\n", "attributes": {"list": "ordered"}},
      {"insert": "5. Oração de encerramento\n", "attributes": {"list": "ordered"}}
    ]
  }',
  (SELECT id FROM users WHERE email = 'admin@email.com'), '2023-03-01 10:00:00'),

  -- 2: Assembleia Extraordinária de Novembro de 2023 (Baseado na Ata 723)
  ('2023-11-12', 'extraordinária', 
  '{
    "ops": [
      {"insert": "Pauta da Assembleia Extraordinária\n", "attributes": {"header": 1}},
      {"insert": "1. Eleição e posse da diretoria para o exercício de 2024.\n", "attributes": {"list": "ordered"}}
    ]
  }',
  (SELECT id FROM users WHERE email = 'admin@email.com'), '2023-11-01 14:00:00'),

  -- 3: Assembleia Ordinária de Fevereiro de 2025 (Baseado no PDF Pauta Assembleia)
  ('2025-02-15', 'ordinária', 
  '{
    "ops": [
      {"insert": "Assembleia Ordinária 15/02/2025\n", "attributes": {"header": 1}},
      {"insert": "Ordem do Dia\n", "attributes": {"header": 2}},
      {"insert": "Leitura e aprovação das atas anteriores\n"},
      {"insert": "Leitura e aprovação do Relatório Financeiro\n"},
      {"insert": "Movimento de Membros\n", "attributes": {"bold": true}},
      {"insert": "Saída: Promovido para a Nova Jerusalém Celestial irmão Paulo Rodrigues de Oliveira, dia 30/01/2025\n"},
      {"insert": "Metas Ministeriais e Estruturais para 2025\n", "attributes": {"bold": true}},
      {"insert": "Apresentação do Orçamento Anual 2025\n", "attributes": {"bold": true}}
    ]
  }',
  (SELECT id FROM users WHERE email = 'admin@email.com'), '2025-02-05 09:00:00'),
  
  -- 4: Assembleia Fictícia para demonstrar o versionamento
  ('2025-04-26', 'ordinária', 
  '{
    "ops": [
      {"insert": "Pauta da Assembleia de Abril\n", "attributes": {"header": 1}},
      {"insert": "Assuntos gerais e planejamento do retiro de Páscoa.\n"}
    ]
  }',
  (SELECT id FROM users WHERE email = 'admin@email.com'), '2025-04-15 11:00:00');

-- =============================
-- FUND BALANCES (Daily Snapshots)
-- =============================
-- These records are calculated from the sum of 'paga' income and expense entries in this seed file.
INSERT INTO fund_balances (reference_date, available_balance, savings_balance)
VALUES
  ('2025-08-10', 680.00, 120.00),   -- Net: 800.00
  ('2025-08-15', 459.00, 81.00),    -- Net: 540.00
  ('2025-08-20', 119.00, 21.00),    -- Net: 140.00
  ('2025-08-25', -202.40, -35.60),  -- Net: -220.00 (Example of negative balance)
  ('2025-09-07', 1085.60, 191.40),  -- Net: 1300.00
  ('2025-09-15', 837.60, 147.40),   -- Net: 985.00
  ('2025-09-20', 497.60, 87.40),    -- Net: 585.00
  ('2025-09-25', 195.50, 34.50),    -- Net: 230.00
  ('2025-09-30', 365.50, 64.50),    -- Net: 430.00
  ('2025-10-05', 833.00, 147.00),   -- Net: 980.00
  ('2025-10-10', 620.50, 109.50),   -- Net: 730.00
  ('2025-10-12', 748.00, 132.00),   -- Net: 880.00
  ('2025-10-15', 408.00, 72.00);    -- Net: 480.00

-- =============================
-- MINUTES & MINUTE VERSIONS
-- =============================

-- Exemplo 1: Ata 719 (baseado no .docx)
DO $$
DECLARE
  meeting_id INT;
  minute_id INT;
  user_id INT;
BEGIN
  SELECT id INTO meeting_id FROM board_meetings WHERE meeting_date = '2023-03-12';
  SELECT id INTO user_id FROM users WHERE email = 'secretario.resp@email.com'; -- Atribuído ao Secretário Responsável

  INSERT INTO minutes (board_meeting_id, minute_number)
  VALUES (meeting_id, '719') RETURNING id INTO minute_id;
  
  INSERT INTO minute_versions (minute_id, content, version, status, reason_for_change, created_by_user_id, approved_at_meeting_id)
  VALUES (
    minute_id,
    '{
      "ops": [
        {"insert": "Ata de número 719\n", "attributes": {"header": 1}},
        {"insert": "No dia 12 de março de 2023, às 17:10hs, o Pastor Deucir Araújo de Almeida, declarou aberta a assembleia. Foi lida e aprovada a Ata de nº 718. Foi lido o Relatório Financeiro referente aos meses de janeiro e fevereiro de 2023. Foram aprovados os apoios financeiros aos seminaristas Dárcio Batista Campos e Andrew Cavalheiro Costa Leite, e a continuidade do auxílio a Cristiano Roberto Valente. A assembleia foi encerrada com uma oração.\n"}
      ]
    }',
    1,
    'aprovada',
    'Criação inicial da ata.',
    user_id,
    meeting_id
  );
END $$;

-- Exemplo 2: Ata 723 (baseado no PDF)
DO $$
DECLARE
  meeting_id INT;
  minute_id INT;
  user_id INT;
BEGIN
  SELECT id INTO meeting_id FROM board_meetings WHERE meeting_date = '2023-11-12';
  SELECT id INTO user_id FROM users WHERE email = 'secretario.resp@email.com'; -- Atribuído ao Secretário Responsável

  INSERT INTO minutes (board_meeting_id, minute_number)
  VALUES (meeting_id, '723') RETURNING id INTO minute_id;
  
  INSERT INTO minute_versions (minute_id, content, version, status, reason_for_change, created_by_user_id, approved_at_meeting_id)
  VALUES (
    minute_id,
    '{
      "ops": [
        {"insert": "Ata de número 723 - Assembleia Extraordinária\n", "attributes": {"header": 1}},
        {"insert": "Realizada no dia 12 de novembro de 2023, com o propósito de eleger e empossar a diretoria para o exercício administrativo de 2024. A proposta da comissão foi aceita e aprovada por unanimidade. A diretoria eleita tomou posse nesta data. A assembleia foi encerrada às 19:30hs.\n"}
      ]
    }',
    1,
    'aprovada',
    'Criação inicial da ata.',
    user_id,
    meeting_id
  );
END $$;

-- Exemplo 3: Ata com Múltiplas Versões (para teste)
DO $$
DECLARE
  meeting_id INT;
  minute_id INT;
  user_id INT;
BEGIN
  SELECT id INTO meeting_id FROM board_meetings WHERE meeting_date = '2025-04-26';
  SELECT id INTO user_id FROM users WHERE email = 'secretario.resp@email.com'; -- Atribuído ao Secretário Responsável

  INSERT INTO minutes (board_meeting_id, minute_number)
  VALUES (meeting_id, '725') RETURNING id INTO minute_id;
  
  -- Versão 1: Aprovada na reunião
  INSERT INTO minute_versions (minute_id, content, version, status, reason_for_change, created_by_user_id, approved_at_meeting_id)
  VALUES (
    minute_id,
    '{
      "ops": [
        {"insert": "Ata de número 725 - Versão Original\n", "attributes": {"header": 1}},
        {"insert": "Discussão sobre os preparativos para o Retiro de Páscoa. Foi aprovado o orçamento de R$ 5.000,00 para o evento.\n"}
      ]
    }',
    1,
    'aprovada',
    'Criação inicial da ata.',
    user_id,
    meeting_id
  );
  
  -- Versão 2: Correção pendente de aprovação
  INSERT INTO minute_versions (minute_id, content, version, status, reason_for_change, created_by_user_id)
  VALUES (
    minute_id,
    '{
      "ops": [
        {"insert": "Ata de número 725 - Versão Corrigida\n", "attributes": {"header": 1}},
        {"insert": "Discussão sobre os preparativos para o Retiro de Páscoa. Foi aprovado o orçamento de R$ 5.500,00 para o evento. ", "attributes": {"bold": true}},
        {"insert": "Foi incluída também a organização de uma equipe de louvor específica para o retiro.\n"}
      ]
    }',
    2,
    'aguardando aprovação',
    'Correção do valor do orçamento e adição da equipe de louvor.',
    user_id
  );
END $$;