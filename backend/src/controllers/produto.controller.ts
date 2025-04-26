import { Request, Response } from "express";
import asyncHandler from "utils/asyncHandler";
import * as ProdutoService from "services/produto.service";
import { notFound } from "errors/errorFactory.js";

export const listarTodos = asyncHandler(
  async (_: Request, res: Response): Promise<void> => {
    const produtos = await ProdutoService.listarTodos();
    res.status(200).json(produtos);
  }
);

export const buscarPorId = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const produto = await ProdutoService.buscarPorId(Number(req.params.id));
    if (!produto) throw notFound("Produto não encontrado");
    res.status(200).json(produto);
  }
);

export const criar = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const novo = await ProdutoService.criar(req.body);
    res.status(201).json(novo);
  }
);

export const atualizar = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const produto = await ProdutoService.atualizar(
      Number(req.params.id),
      req.body
    );
    if (!produto) throw notFound("Produto não encontrado");
    res.status(200).json(produto);
  }
);

export const deletar = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const ok = await ProdutoService.deletar(Number(req.params.id));
    if (!ok) throw notFound("Produto não encontrado");
    res.sendStatus(204);
  }
);
