// src/repositories/produto.repository.ts
import { sql } from 'db/db'
import { Produto } from 'types/produto'

export const listarTodos = async (): Promise<Produto[]> => {
  return await sql<Produto[]>`SELECT * FROM produtos ORDER BY id`
}

export const buscarPorId = async (id: number): Promise<Produto | null> => {
  const [produto] = await sql<Produto[]>`SELECT * FROM produtos WHERE id = ${id}`
  return produto || null
}

export const criar = async (data: Omit<Produto, 'id' | 'created_at'>): Promise<Produto> => {
  const [novo] = await sql<Produto[]>`
    INSERT INTO produtos (nome, preco, estoque)
    VALUES (${data.nome}, ${data.preco}, ${data.estoque})
    RETURNING *`
  return novo
}

export const atualizar = async (
  id: number,
  data: Partial<Omit<Produto, 'id' | 'created_at'>>
): Promise<Produto | null> => {
  const [produto] = await sql<Produto[]>`
    UPDATE produtos SET
      nome = COALESCE(${data.nome}, nome),
      preco = COALESCE(${data.preco}, preco),
      estoque = COALESCE(${data.estoque}, estoque)
    WHERE id = ${id}
    RETURNING *`
  return produto || null
}

export const deletar = async (id: number): Promise<boolean> => {
  const result = await sql`DELETE FROM produtos WHERE id = ${id}`
  return result.count > 0
}
