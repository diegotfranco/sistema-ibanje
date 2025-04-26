DROP TABLE IF EXISTS "usuarios";
CREATE TABLE "usuarios" (
  "id" serial PRIMARY KEY,
  "nome" varchar(96) NOT NULL,
  "email" varchar(96) UNIQUE,
  "hash" char(193),
  "id_cargo" int DEFAULT 1,
  "id_status" int DEFAULT 1
);

DROP TABLE IF EXISTS "cargos";
CREATE TABLE "cargos" (
  "id" serial PRIMARY KEY,
  "nome" varchar(64) UNIQUE,
  "descricao" varchar(256),
  "id_status" int DEFAULT 1
);

DROP TABLE IF EXISTS "areas";
CREATE TABLE "areas" (
  "id" serial PRIMARY KEY,
  "nome" varchar(64) UNIQUE,
  "descricao" varchar(256),
  "id_status" int DEFAULT 1
);

DROP TABLE IF EXISTS "permissoes";
CREATE TABLE "permissoes" (
  "id" serial PRIMARY KEY,
  "nome" varchar(64) UNIQUE,
  "descricao" varchar(256),
  "id_status" int DEFAULT 1
);

DROP TABLE IF EXISTS "usuarios_x_areas_x_permissoes";
CREATE TABLE "usuarios_x_areas_x_permissoes" (
  "id_usuario" int,
  "id_area" int,
  "id_permissao" int,
  PRIMARY KEY ("id_usuario", "id_area", "id_permissao")
);

DROP TABLE IF EXISTS "cargos_x_areas_x_permissoes";
CREATE TABLE "cargos_x_areas_x_permissoes" (
  "id_cargo" int,
  "id_area" int,
  "id_permissao" int,
  PRIMARY KEY ("id_cargo", "id_area", "id_permissao")
);

DROP TABLE IF EXISTS "status";
CREATE TABLE "status" (
  "id" serial PRIMARY KEY,
  "nome" varchar(64) UNIQUE,
  "descricao" varchar(256)
);

DROP TABLE IF EXISTS "caixa";
CREATE TABLE "caixa" (
  "id" serial PRIMARY KEY,
  "data" date,
  "caixa" money,
  "poupanca" money
);

DROP TABLE IF EXISTS "pagamentos";
CREATE TABLE "pagamentos" (
  "id" serial PRIMARY KEY,
  "nome" varchar(64) UNIQUE,
  "entrada" bool,
  "saida" bool,
  "id_status" int DEFAULT 1
);

DROP TABLE IF EXISTS "entradas";
CREATE TABLE "entradas" (
  "id" serial PRIMARY KEY,
  "nome" varchar(64) UNIQUE,
  "id_status" int DEFAULT 1
);

DROP TABLE IF EXISTS "mov_entradas";
CREATE TABLE "mov_entradas" (
  "id" serial PRIMARY KEY,
  "data_referencia" date,
  "data_deposito" date,
  "valor" money,
  "id_entrada" int NOT NULL,
  "id_membro" int,
  "id_pagamento" int NOT NULL,
  "id_status" int DEFAULT 1
);

DROP TABLE IF EXISTS "saidas";
CREATE TABLE "saidas" (
  "id" serial PRIMARY KEY,
  "nome" varchar(64) UNIQUE,
  "id_status" int DEFAULT 1
);

DROP TABLE IF EXISTS "mov_saidas";
CREATE TABLE "mov_saidas" (
  "id" serial PRIMARY KEY,
  "data_referencia" date,
  "total" money,
  "valor" money,
  "parcela" int DEFAULT 1,
  "num_parcelas" int DEFAULT 1,
  "id_saida" int NOT NULL,
  "id_usuario" int NOT NULL,
  "id_pagamento" int NOT NULL,
  "comprovante" varchar(36),
  "id_status" int DEFAULT 1
);

DROP TABLE IF EXISTS "membros";
CREATE TABLE "membros" (
  "id" serial PRIMARY KEY,
  "nome" varchar(96) NOT NULL,
  "data_nascimento" date,
  "logradouro" varchar(96),
  "numero" int,
  "complemento" varchar(64),
  "bairro" varchar(64),
  "uf" char(2),
  "cidade" varchar(96),
  "cep" char(8),
  "email" varchar(96),
  "telefone" varchar(16),
  "id_status" int DEFAULT 1
);

-- ALTER TABLE "cargos" ADD FOREIGN KEY ("id") REFERENCES "usuarios" ("cargo_id");
-- 
-- ALTER TABLE "usuarios_x_areas_x_permissoes" ADD FOREIGN KEY ("id_usuario") REFERENCES "usuarios" ("id");
-- 
-- ALTER TABLE "usuarios_x_areas_x_permissoes" ADD FOREIGN KEY ("id_area") REFERENCES "areas" ("id");
-- 
-- ALTER TABLE "usuarios_x_areas_x_permissoes" ADD FOREIGN KEY ("id_permissao") REFERENCES "permissoes" ("id");
-- 
-- ALTER TABLE "cargos_x_areas_x_permissoes" ADD FOREIGN KEY ("id_cargo") REFERENCES "cargos" ("id");
-- 
-- ALTER TABLE "cargos_x_areas_x_permissoes" ADD FOREIGN KEY ("id_area") REFERENCES "areas" ("id");
-- 
-- ALTER TABLE "cargos_x_areas_x_permissoes" ADD FOREIGN KEY ("id_permissao") REFERENCES "permissoes" ("id");
-- 
-- ALTER TABLE "mov_entradas" ADD FOREIGN KEY ("id_entrada") REFERENCES "entradas" ("id");
-- 
-- ALTER TABLE "mov_entradas" ADD FOREIGN KEY ("id_membro") REFERENCES "membros" ("id");
-- 
-- ALTER TABLE "mov_entradas" ADD FOREIGN KEY ("id_pagamento") REFERENCES "pagamentos" ("id");
-- 
-- ALTER TABLE "mov_saidas" ADD FOREIGN KEY ("id_pagamento") REFERENCES "pagamentos" ("id");
-- 
-- ALTER TABLE "mov_saidas" ADD FOREIGN KEY ("id_saida") REFERENCES "saidas" ("id");
-- 
-- ALTER TABLE "usuarios" ADD FOREIGN KEY ("id_status") REFERENCES "status" ("id");
-- 
-- ALTER TABLE "cargos" ADD FOREIGN KEY ("id_status") REFERENCES "status" ("id");
-- 
-- ALTER TABLE "pagamentos" ADD FOREIGN KEY ("id_status") REFERENCES "status" ("id");
-- 
-- ALTER TABLE "entradas" ADD FOREIGN KEY ("id_status") REFERENCES "status" ("id");
-- 
-- ALTER TABLE "saidas" ADD FOREIGN KEY ("id_status") REFERENCES "status" ("id");
-- 
-- ALTER TABLE "mov_entradas" ADD FOREIGN KEY ("id_status") REFERENCES "status" ("id");
-- 
-- ALTER TABLE "mov_saidas" ADD FOREIGN KEY ("id_status") REFERENCES "status" ("id");
-- 
-- ALTER TABLE "membros" ADD FOREIGN KEY ("id_status") REFERENCES "status" ("id");
-- 
-- ALTER TABLE "permissoes" ADD FOREIGN KEY ("id_status") REFERENCES "status" ("id");
