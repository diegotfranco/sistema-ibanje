import { Request, Response } from 'express'
import * as ProdutoService from 'services/produto.service'

export const listarTodos = async (_: Request, res: Response) => {
  const produtos = await ProdutoService.listarTodos()
  res.json(produtos)
}

export const buscarPorId = async (req: Request, res: Response) => {
  const produto = await ProdutoService.buscarPorId(Number(req.params.id))
  if (!produto) return res.status(404).json({ error: 'Produto não encontrado' })
  res.json(produto)
}

export const criar = async (req: Request, res: Response) => {
  const novo = await ProdutoService.criar(req.body)
  res.status(201).json(novo)
}

export const atualizar = async (req: Request, res: Response) => {
  const produto = await ProdutoService.atualizar(Number(req.params.id), req.body)
  if (!produto) return res.status(404).json({ error: 'Produto não encontrado' })
  res.json(produto)
}

export const deletar = async (req: Request, res: Response) => {
  const ok = await ProdutoService.deletar(Number(req.params.id))
  if (!ok) return res.status(404).json({ error: 'Produto não encontrado' })
  res.status(204).send()
}
